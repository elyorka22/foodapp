import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { MetricsService } from '../../common/monitoring/metrics.service';
import { SlowQueryService } from '../../common/monitoring/slow-query.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const EMPTY_QUEUE = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private metrics: MetricsService,
    private slowQuery: SlowQueryService,
    private redis: RedisCacheService,
  ) {}

  @Get('metrics')
  @SkipThrottle()
  metricsSnapshot() {
    return this.metrics.snapshot();
  }

  @Get('observability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async observability(): Promise<Record<string, unknown>> {
    const redisOk = await this.redis.ping();
    return {
      http: this.metrics.snapshot(),
      slowQueries: this.slowQuery.snapshot(),
      redis: { ok: redisOk, mode: 'memory' },
      queues: {
        orders: EMPTY_QUEUE,
        notifications: EMPTY_QUEUE,
        telegram: EMPTY_QUEUE,
        disabled: true,
      },
      database: { primaryConfigured: !!process.env.DATABASE_URL },
      checkedAt: new Date().toISOString(),
    };
  }

  @Get('queues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  queues() {
    return {
      orders: EMPTY_QUEUE,
      notifications: EMPTY_QUEUE,
      telegram: EMPTY_QUEUE,
      disabled: true,
      checkedAt: new Date().toISOString(),
    };
  }
}
