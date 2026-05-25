import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { MetricsService } from '../../common/monitoring/metrics.service';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisCacheService,
    private metrics: MetricsService,
  ) {}

  @Get()
  async check() {
    const checks: Record<string, string> = {};
    let ok = true;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = 'up';
    } catch {
      checks.database = 'down';
      ok = false;
    }

    try {
      await this.redis.ping();
      checks.redis = 'up';
    } catch {
      checks.redis = 'down';
      ok = false;
    }

    const mem = process.memoryUsage();
    return {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      checks,
      memoryMb: Math.round(mem.rss / 1024 / 1024),
    };
  }

  @Get('ready')
  async ready() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ready: true };
  }

  @Get('live')
  live() {
    return { live: true };
  }
}
