import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CourierStatus, UserRole } from '@prisma/client';
import { CouriersService } from './couriers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('couriers')
@Controller('couriers')
export class CouriersController {
  constructor(private couriers: CouriersService) {}

  @Get('available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findAvailable() {
    return this.couriers.findAvailable();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiBearerAuth()
  me(@CurrentUser() user: { id: string }) {
    return this.couriers.getByUserId(user.id);
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiBearerAuth()
  myOrders(@CurrentUser() user: { id: string }) {
    return this.couriers.getByUserId(user.id).then((c) => this.couriers.getActiveOrders(c.id));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couriers.findOne(id);
  }

  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiBearerAuth()
  earnings(
    @CurrentUser() user: { id: string },
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.couriers.getByUserId(user.id).then((c) => this.couriers.getEarnings(c.id, from, to));
  }

  @Get('me/route')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiBearerAuth()
  route(@CurrentUser() user: { id: string }, @Query('hours') hours?: number) {
    return this.couriers.getByUserId(user.id).then((c) => this.couriers.getRouteHistory(c.id, Number(hours) || 24));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER, UserRole.ADMIN)
  @ApiBearerAuth()
  updateStatus(@Param('id') id: string, @Body('status') status: CourierStatus) {
    return this.couriers.updateStatus(id, status);
  }

  @Patch('orders/:orderId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COURIER)
  @ApiBearerAuth()
  complete(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.couriers.getByUserId(user.id).then((c) => this.couriers.completeDelivery(orderId, c.id));
  }
}
