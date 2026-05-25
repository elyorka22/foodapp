import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { BusinessMetricsService } from './business-metrics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, BusinessMetricsService],
  exports: [BusinessMetricsService],
})
export class AnalyticsModule {}
