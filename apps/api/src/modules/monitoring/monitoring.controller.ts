import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { UserRole } from '@prisma/client';
import { MetricsService } from '../../common/monitoring/metrics.service';
import { WsMetricsService } from '../../common/monitoring/ws-metrics.service';
import { SlowQueryService } from '../../common/monitoring/slow-query.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(
    private metrics: MetricsService,
    private wsMetrics: WsMetricsService,
    private slowQuery: SlowQueryService,
    private redis: RedisCacheService,
    @InjectQueue('orders') private ordersQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('telegram') private telegramQueue: Queue,
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
    const [queues, redisOk] = await Promise.all([
      Promise.all([
        this.ordersQueue.getJobCounts(),
        this.notificationsQueue.getJobCounts(),
        this.telegramQueue.getJobCounts(),
      ]),
      this.redis.ping(),
    ]);
    const waitingTotal =
      (queues[0].waiting ?? 0) + (queues[1].waiting ?? 0) + (queues[2].waiting ?? 0);
    const failedTotal =
      (queues[0].failed ?? 0) + (queues[1].failed ?? 0) + (queues[2].failed ?? 0);
    return {
      http: this.metrics.snapshot(),
      websocket: this.wsMetrics.snapshot(),
      slowQueries: this.slowQuery.snapshot(),
      redis: { ok: redisOk },
      queues: {
        orders: queues[0],
        notifications: queues[1],
        telegram: queues[2],
        latencyHint: {
          waitingHigh: waitingTotal > 50,
          failedJobs: failedTotal,
        },
      },
      database: {
        primaryConfigured: !!process.env.DATABASE_URL,
        readReplicaReady: !!process.env.DATABASE_READ_URL,
        poolNote: 'Use PgBouncer or connection_limit in DATABASE_URL for production scale',
      },
      infrastructure: {
        readReplicaReady: !!process.env.DATABASE_READ_URL,
        wsRedisAdapter: !!process.env.REDIS_WS_ADAPTER_URL,
        cdnBase: process.env.CDN_BASE_URL ?? null,
        workerConcurrency: process.env.WORKER_CONCURRENCY ?? '1',
        slowQueryThresholdMs: process.env.SLOW_QUERY_MS ?? '500',
      },
      checkedAt: new Date().toISOString(),
    };
  }

  @Get('queues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  async queues() {
    const [orders, notifications, telegram] = await Promise.all([
      this.ordersQueue.getJobCounts(),
      this.notificationsQueue.getJobCounts(),
      this.telegramQueue.getJobCounts(),
    ]);
    const waitingTotal = (orders.waiting ?? 0) + (notifications.waiting ?? 0) + (telegram.waiting ?? 0);
    return {
      orders,
      notifications,
      telegram,
      latencyHint: {
        waitingHigh: waitingTotal > 50,
        failedJobs: (orders.failed ?? 0) + (notifications.failed ?? 0) + (telegram.failed ?? 0),
      },
      checkedAt: new Date().toISOString(),
    };
  }
}
