import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BusinessesService } from './businesses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QueryBusinessesDto } from './dto/query-businesses.dto';

@ApiTags('businesses')
@Controller('businesses')
export class BusinessesController {
  constructor(private businesses: BusinessesService) {}

  @Get()
  findAll(@Query() query: QueryBusinessesDto) {
    return this.businesses.findAll(query);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.businesses.findBySlug(slug);
  }

  @Get(':id/inventory')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  inventory(@Param('id') id: string) {
    return this.businesses.getInventory(id);
  }

  @Patch('inventory/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUSINESS_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  updateInventory(@Param('productId') productId: string, @Body('quantity') quantity: number) {
    return this.businesses.updateInventory(productId, quantity);
  }
}
