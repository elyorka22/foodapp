import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateOrderDto, @CurrentUser() user?: { id: string }) {
    return this.orders.create(dto, user?.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  findAll(
    @CurrentUser() user: { id: string; role: UserRole },
    @Query('status') status?: OrderStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('restaurantId') restaurantId?: string,
    @Query('businessId') businessId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const filters: Parameters<OrdersService['findAll']>[0] = {
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      from,
      to,
    };
    if (user.role === UserRole.CUSTOMER) filters.customerId = user.id;
    if (user.role === UserRole.RESTAURANT_OWNER) filters.restaurantId = restaurantId;
    if (user.role === UserRole.BUSINESS_OWNER) filters.businessId = businessId;
    if (user.role === UserRole.COURIER) filters.courierId = undefined;
    return this.orders.findAll(filters);
  }

  @Post(':id/reorder')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  reorder(@Param('id') id: string, @CurrentUser() user?: { id: string }) {
    return this.orders.reorder(id, user?.id);
  }

  @Patch(':id/cancel')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user?: { id: string; role: UserRole },
  ) {
    return this.orders.cancel(id, dto, user?.id, user?.role);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.orders.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT_OWNER, UserRole.BUSINESS_OWNER, UserRole.COURIER)
  @ApiBearerAuth()
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.orders.updateStatus(id, dto, user.id, user.role);
  }

  @Patch(':id/assign-courier')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.COURIER)
  @ApiBearerAuth()
  assignCourier(@Param('id') id: string, @Body('courierId') courierId: string) {
    return this.orders.assignCourier(id, courierId);
  }
}
