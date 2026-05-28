import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { RedisCacheService } from './services/redis-cache.service';
import { AuditService } from './services/audit.service';
import { MetricsService } from './monitoring/metrics.service';
import { SlowQueryService } from './monitoring/slow-query.service';
import { GlobalExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

@Global()
@Module({
  providers: [
    RedisCacheService,
    AuditService,
    MetricsService,
    SlowQueryService,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [RedisCacheService, AuditService, MetricsService, SlowQueryService],
})
export class CommonModule {}
