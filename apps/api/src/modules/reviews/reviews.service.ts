import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: { orderId: string; rating: number; comment?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      include: { review: true },
    });
    if (!order || order.status !== 'DELIVERED') {
      throw new BadRequestException('Order must be delivered to review');
    }
    if (order.review) throw new BadRequestException('Already reviewed');

    const review = await this.prisma.review.create({
      data: {
        userId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
        restaurantId: order.restaurantId,
        businessId: order.businessId,
      },
    });

    if (order.restaurantId) {
      await this.updateVendorRating('restaurant', order.restaurantId);
    }
    if (order.businessId) {
      await this.updateVendorRating('business', order.businessId);
    }

    return review;
  }

  private async updateVendorRating(type: 'restaurant' | 'business', id: string) {
    const reviews = await this.prisma.review.findMany({
      where: type === 'restaurant' ? { restaurantId: id } : { businessId: id },
    });
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    if (type === 'restaurant') {
      await this.prisma.restaurant.update({
        where: { id },
        data: { rating: avg, reviewCount: reviews.length },
      });
    } else {
      await this.prisma.business.update({
        where: { id },
        data: { rating: avg, reviewCount: reviews.length },
      });
    }
  }

  async findByVendor(restaurantId?: string, businessId?: string) {
    return this.prisma.review.findMany({
      where: { restaurantId, businessId },
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
