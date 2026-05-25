import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PromosService } from './promos.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('promos')
@Controller('promos')
export class PromosController {
  constructor(private promos: PromosService) {}

  @Get('validate')
  validate(@Query('code') code: string, @Query('subtotal') subtotal: number) {
    return this.promos.validate(code, +subtotal);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  findAll() {
    return this.promos.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  create(@Body() body: { code: string; type: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY'; value: number }) {
    return this.promos.create(body as never);
  }
}
