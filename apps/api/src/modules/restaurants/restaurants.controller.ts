import { Controller, Get, Param, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { RestaurantsService } from './restaurants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private restaurants: RestaurantsService) {}

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.restaurants.findAll({
      city,
      featured: featured === 'true',
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.restaurants.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurants.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.restaurants.update(id, body);
  }

  @Patch(':id/toggle-open')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  toggleOpen(@Param('id') id: string, @Body('isOpen') isOpen: boolean) {
    return this.restaurants.update(id, { isOpen });
  }
}
