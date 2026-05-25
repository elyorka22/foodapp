import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private client: Redis | null = null;

  constructor(private config: ConfigService) {}

  private getClient(): Redis {
    if (!this.client) {
      const url = this.config.get('REDIS_URL');
      this.client = url
        ? new Redis(url)
        : new Redis({
            host: this.config.get('REDIS_HOST', 'localhost'),
            port: parseInt(this.config.get('REDIS_PORT', '6379'), 10),
          });
    }
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.getClient().get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await this.getClient().setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      /* cache optional */
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.getClient().del(key);
    } catch {
      /* ignore */
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.getClient().keys(pattern);
      if (keys.length) await this.getClient().del(...keys);
    } catch {
      /* ignore */
    }
  }

  async ping(): Promise<boolean> {
    try {
      const pong = await this.getClient().ping();
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
