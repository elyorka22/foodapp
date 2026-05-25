import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { BusinessMetricsService } from './business-metrics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RESTAURANT_OWNER, UserRole.BUSINESS_OWNER)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private analytics: AnalyticsService,
    private businessMetrics: BusinessMetricsService,
  ) {}

  @Get('operations')
  @Roles(UserRole.ADMIN)
  operations(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('city') city?: string,
  ) {
    return this.businessMetrics.getOperationsMetrics(from, to, city);
  }

  @Get('dashboard')
  dashboard(
    @Query('vendorId') vendorId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analytics.getDashboard(vendorId, from, to);
  }
}
