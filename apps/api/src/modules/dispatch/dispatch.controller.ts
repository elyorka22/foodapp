import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('dispatch')
@Controller('dispatch')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class DispatchController {
  constructor(private dispatch: DispatchService) {}

  @Get('overview')
  overview() {
    return this.dispatch.dispatchOverview();
  }

  @Get('suggest/:orderId')
  suggest(@Param('orderId') orderId: string, @Query('limit') limit?: number) {
    return this.dispatch.suggestCouriersForOrder(orderId, Number(limit) || 5);
  }
}
