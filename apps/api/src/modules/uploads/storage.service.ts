import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class StorageService {
  private s3: S3Client | null = null;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get('DO_SPACES_ENDPOINT');
    if (endpoint) {
      this.s3 = new S3Client({
        endpoint,
        region: this.config.get('DO_SPACES_REGION', 'fra1'),
        credentials: {
          accessKeyId: this.config.get('DO_SPACES_KEY', ''),
          secretAccessKey: this.config.get('DO_SPACES_SECRET', ''),
        },
        forcePathStyle: false,
      });
    }
  }

  async processAndUpload(file: Express.Multer.File): Promise<{
    url: string;
    thumbnailUrl: string;
    smallUrl: string;
    mediumUrl: string;
  }> {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Faqat JPEG, PNG, WebP');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Maksimal 5MB');
    }

    const baseName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const webpBuffer = await sharp(file.buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const [smallBuffer, thumbBuffer, mediumBuffer] = await Promise.all([
      sharp(file.buffer).resize(200, 200, { fit: 'cover' }).webp({ quality: 70 }).toBuffer(),
      sharp(file.buffer).resize(400, 400, { fit: 'cover' }).webp({ quality: 75 }).toBuffer(),
      sharp(file.buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    ]);

    const cacheControl = 'public, max-age=31536000, immutable';

    if (this.s3) {
      const bucket = this.config.get('DO_SPACES_BUCKET', 'foodmarket');
      const cdn = this.config.get('CDN_BASE_URL', '');
      const keys = {
        large: `uploads/${baseName}-lg.webp`,
        medium: `uploads/${baseName}-md.webp`,
        thumb: `uploads/${baseName}-thumb.webp`,
        small: `uploads/${baseName}-sm.webp`,
      };
      const uploads = [
        [keys.large, webpBuffer],
        [keys.medium, mediumBuffer],
        [keys.thumb, thumbBuffer],
        [keys.small, smallBuffer],
      ] as const;
      await Promise.all(
        uploads.map(([Key, Body]) =>
          this.s3!.send(
            new PutObjectCommand({
              Bucket: bucket,
              Key,
              Body,
              ContentType: 'image/webp',
              ACL: 'public-read',
              CacheControl: cacheControl,
            }),
          ),
        ),
      );
      return {
        url: `${cdn}/${keys.large}`,
        mediumUrl: `${cdn}/${keys.medium}`,
        thumbnailUrl: `${cdn}/${keys.thumb}`,
        smallUrl: `${cdn}/${keys.small}`,
      };
    }

    const uploadDir = this.config.get('UPLOAD_DIR', './uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    const base = this.config.get('CDN_BASE_URL', '') || '';
    const paths = {
      lg: `${baseName}-lg.webp`,
      md: `${baseName}-md.webp`,
      thumb: `${baseName}-thumb.webp`,
      sm: `${baseName}-sm.webp`,
    };
    await Promise.all([
      fs.writeFile(path.join(uploadDir, paths.lg), webpBuffer),
      fs.writeFile(path.join(uploadDir, paths.md), mediumBuffer),
      fs.writeFile(path.join(uploadDir, paths.thumb), thumbBuffer),
      fs.writeFile(path.join(uploadDir, paths.sm), smallBuffer),
    ]);
    return {
      url: `${base}/uploads/${paths.lg}`,
      mediumUrl: `${base}/uploads/${paths.md}`,
      thumbnailUrl: `${base}/uploads/${paths.thumb}`,
      smallUrl: `${base}/uploads/${paths.sm}`,
    };
  }
}
