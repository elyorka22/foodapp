import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categories: CategoriesService) {}

  @Get()
  list(@Query('restaurantId') restaurantId?: string, @Query('businessId') businessId?: string) {
    if (restaurantId) return this.categories.findByRestaurant(restaurantId);
    if (businessId) return this.categories.findByBusiness(businessId);
    return [];
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  create(@Body() body: { name: string; slug: string; restaurantId?: string; businessId?: string }) {
    return this.categories.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: { name?: string; isActive?: boolean }) {
    return this.categories.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.categories.remove(id);
  }
}
