import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import {
  haversineKm,
  calculateDeliveryFee,
  estimateDeliveryMinutes,
} from '../../common/utils/distance';

@Injectable()
export class DeliveryService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  async getQuote(vendorLat: number, vendorLng: number, destLat: number, destLng: number) {
    const cacheKey = `quote:${vendorLat}:${vendorLng}:${destLat}:${destLng}`;
    const cached = await this.cache.get<{
      distanceKm: number;
      deliveryFee: number;
      estimatedMinutes: number;
      withinRadius: boolean;
      minOrderAmount: number;
      zoneName?: string;
    }>(cacheKey);
    if (cached) return cached;

    const distanceKm = haversineKm(vendorLat, vendorLng, destLat, destLng);
    const zone = await this.findZone(destLat, destLng);

    const baseFee = zone?.baseFee ?? parseFloat(this.config.get('BASE_DELIVERY_FEE', '15000'));
    const perKmFee = zone?.perKmFee ?? parseFloat(this.config.get('PER_KM_FEE', '3000'));
    const maxRadius = zone?.radiusKm ?? parseFloat(this.config.get('MAX_DELIVERY_RADIUS_KM', '12'));
    const minOrderAmount = zone?.minOrderAmount ?? parseFloat(this.config.get('MIN_ORDER_AMOUNT', '50000'));

    let deliveryFee = calculateDeliveryFee(distanceKm, baseFee, perKmFee);
    const withinRadius = distanceKm <= maxRadius;
    if (!withinRadius) {
      throw new BadRequestException('Manzil yetkazib berish zonasidan tashqarida');
    }

    const result = {
      distanceKm,
      deliveryFee,
      estimatedMinutes: estimateDeliveryMinutes(distanceKm),
      withinRadius,
      minOrderAmount,
      zoneName: zone?.name,
    };
    await this.cache.set(cacheKey, result, 120);
    return result;
  }

  private async findZone(lat: number, lng: number) {
    const zones = await this.prisma.deliveryZone.findMany({ where: { isActive: true } });
    for (const zone of zones) {
      const d = haversineKm(zone.centerLat, zone.centerLng, lat, lng);
      if (d <= zone.radiusKm) return zone;
    }
    return zones[0] ?? null;
  }
}
