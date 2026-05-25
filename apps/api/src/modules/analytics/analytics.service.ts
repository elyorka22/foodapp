import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  async getDashboard(vendorId?: string, from?: string, to?: string) {
    const cacheKey = `analytics:${vendorId ?? 'all'}:${from ?? ''}:${to ?? ''}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = from ? new Date(from) : today;
    const toDate = to ? new Date(to) : new Date();

    const vendorWhere = vendorId
      ? { OR: [{ restaurantId: vendorId }, { businessId: vendorId }] }
      : {};

    const dateWhere = { createdAt: { gte: fromDate, lte: toDate } };

    const [
      totalOrders,
      todayOrders,
      revenueAgg,
      activeCouriers,
      failedOrders,
      ordersByStatus,
      topRestaurants,
      deliveredOrders,
    ] = await Promise.all([
      this.prisma.order.count({ where: vendorWhere }),
      this.prisma.order.count({ where: { ...vendorWhere, createdAt: { gte: today } } }),
      this.prisma.order.aggregate({
        where: { ...vendorWhere, ...dateWhere, status: OrderStatus.DELIVERED },
        _sum: { total: true },
      }),
      this.prisma.courier.count({
        where: { status: { in: ['AVAILABLE', 'ON_DELIVERY'] } },
      }),
      this.prisma.order.count({
        where: { ...vendorWhere, ...dateWhere, status: { in: ['CANCELLED', 'REFUNDED'] } },
      }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: { ...vendorWhere, ...dateWhere },
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ['restaurantId'],
        where: { ...dateWhere, restaurantId: { not: null }, status: OrderStatus.DELIVERED },
        _count: true,
        _sum: { total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      this.prisma.order.findMany({
        where: {
          ...vendorWhere,
          status: OrderStatus.DELIVERED,
          deliveredAt: { not: null },
          ...dateWhere,
        },
        select: { createdAt: true, deliveredAt: true },
        take: 500,
      }),
    ]);

    const avgDeliveryMinutes =
      deliveredOrders.length > 0
        ? deliveredOrders.reduce((sum, o) => {
            const mins =
              (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 60000;
            return sum + mins;
          }, 0) / deliveredOrders.length
        : 0;

    const peakHours = await this.getPeakHours(vendorWhere, fromDate, toDate);

    const restaurantIds = topRestaurants.map((t) => t.restaurantId).filter(Boolean) as string[];
    const restaurants = await this.prisma.restaurant.findMany({
      where: { id: { in: restaurantIds } },
      select: { id: true, name: true },
    });

    const result = {
      totalOrders,
      todayOrders,
      totalRevenue: revenueAgg._sum.total ?? 0,
      activeCouriers,
      failedOrders,
      avgDeliveryMinutes: Math.round(avgDeliveryMinutes),
      ordersByStatus,
      topRestaurants: topRestaurants.map((t) => ({
        restaurantId: t.restaurantId,
        name: restaurants.find((r) => r.id === t.restaurantId)?.name ?? '—',
        orders: t._count,
        revenue: t._sum.total ?? 0,
      })),
      peakHours,
      currency: 'UZS',
    };

    await this.cache.set(cacheKey, result, 60);
    return result;
  }

  private async getPeakHours(
    vendorWhere: Record<string, unknown>,
    from: Date,
    to: Date,
  ) {
    const orders = await this.prisma.order.findMany({
      where: { ...vendorWhere, createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });
    const hours = new Array(24).fill(0);
    for (const o of orders) {
      hours[o.createdAt.getHours()]++;
    }
    return hours.map((count, hour) => ({ hour, count }));
  }
}
