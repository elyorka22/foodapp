import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @CurrentUser() user: { id: string },
    @Body() body: { orderId: string; rating: number; comment?: string },
  ) {
    return this.reviews.create(user.id, body);
  }

  @Get()
  findByVendor(@Query('restaurantId') restaurantId?: string, @Query('businessId') businessId?: string) {
    return this.reviews.findByVendor(restaurantId, businessId);
  }
}
