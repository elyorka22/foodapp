import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';

const SLA_TARGET_MINUTES = 45;

@Injectable()
export class BusinessMetricsService {
  constructor(
    private prisma: PrismaService,
    private cache: RedisCacheService,
  ) {}

  async getOperationsMetrics(from?: string, to?: string, city?: string) {
    const cacheKey = `biz:${from}:${to}:${city ?? 'all'}`;
    const cached = await this.cache.get<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 86400000);
    const toDate = to ? new Date(to) : new Date();
    const dateWhere = { createdAt: { gte: fromDate, lte: toDate } };

    const [
      delivered,
      cancelled,
      allOrders,
      statusHistories,
      courierStats,
      repeatData,
      basketAgg,
    ] = await Promise.all([
      this.prisma.order.findMany({
        where: { ...dateWhere, status: OrderStatus.DELIVERED, deliveredAt: { not: null } },
        select: { createdAt: true, deliveredAt: true, subtotal: true, restaurantId: true },
      }),
      this.prisma.order.count({
        where: { ...dateWhere, status: { in: ['CANCELLED', 'REFUNDED'] } },
      }),
      this.prisma.order.count({ where: dateWhere }),
      this.prisma.orderStatusHistory.findMany({
        where: { order: dateWhere },
        select: { orderId: true, status: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 5000,
      }),
      this.prisma.courier.findMany({
        select: {
          id: true,
          rating: true,
          totalDeliveries: true,
          user: { select: { firstName: true } },
          orders: {
            where: { ...dateWhere, status: OrderStatus.DELIVERED },
            select: { distanceKm: true, courierEarning: true, deliveredAt: true, createdAt: true },
          },
        },
      }),
      this.prisma.order.groupBy({
        by: ['customerId'],
        where: { ...dateWhere, customerId: { not: null }, status: OrderStatus.DELIVERED },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { ...dateWhere, status: OrderStatus.DELIVERED },
        _avg: { subtotal: true, total: true },
        _count: true,
      }),
    ]);

    const deliveryMinutes = delivered.map(
      (o) => (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 60000,
    );
    const slaMet = deliveryMinutes.filter((m) => m <= SLA_TARGET_MINUTES).length;
    const slaRate = delivered.length ? Math.round((slaMet / delivered.length) * 100) : 0;
    const avgDeliveryMin =
      deliveryMinutes.length > 0
        ? Math.round(deliveryMinutes.reduce((a, b) => a + b, 0) / deliveryMinutes.length)
        : 0;

    const prepTimes = this.calcPrepTimes(statusHistories);
    const cancellationRate = allOrders > 0 ? Math.round((cancelled / allOrders) * 1000) / 10 : 0;

    const repeatCustomers = repeatData.filter((r) => r._count > 1).length;
    const uniqueCustomers = repeatData.length;
    const repeatRate = uniqueCustomers
      ? Math.round((repeatCustomers / uniqueCustomers) * 100)
      : 0;

    const courierPerformance = courierStats
      .map((c) => ({
        id: c.id,
        name: c.user.firstName,
        deliveries: c.orders.length,
        rating: c.rating,
        avgEarning:
          c.orders.length > 0
            ? Math.round(
                c.orders.reduce((s, o) => s + (o.courierEarning ?? 0), 0) / c.orders.length,
              )
            : 0,
      }))
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 10);

    const peakForecast = await this.forecastPeakHours(fromDate, toDate);
    const slaBreaches = delivered.length - slaMet;
    const breachRate = delivered.length
      ? Math.round((slaBreaches / delivered.length) * 100)
      : 0;

    const cancelledOrders = await this.prisma.order.findMany({
      where: { ...dateWhere, status: { in: ['CANCELLED', 'REFUNDED'] } },
      select: { cancelReason: true },
      take: 500,
    });
    const delayReasons = this.aggregateReasons(cancelledOrders.map((o) => o.cancelReason));

    const restaurantResponsiveness = await this.calcRestaurantResponse(fromDate, toDate);

    const result = {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      sla: {
        targetMinutes: SLA_TARGET_MINUTES,
        metPercent: slaRate,
        breachCount: slaBreaches,
        breachRatePercent: breachRate,
        avgDeliveryMinutes: avgDeliveryMin,
        sampleSize: delivered.length,
      },
      cancellations: {
        count: cancelled,
        total: allOrders,
        ratePercent: cancellationRate,
        reasons: delayReasons,
        trend: cancellationRate > 8 ? 'elevated' : 'normal',
      },
      restaurantResponsiveness,
      prepTime: {
        avgMinutes: prepTimes.avg,
        p90Minutes: prepTimes.p90,
        sampleSize: prepTimes.count,
      },
      basket: {
        avgSubtotal: Math.round(basketAgg._avg.subtotal ?? 0),
        avgTotal: Math.round(basketAgg._avg.total ?? 0),
        orders: basketAgg._count,
      },
      retention: {
        uniqueCustomers,
        repeatCustomers,
        repeatRatePercent: repeatRate,
      },
      courierPerformance,
      peakForecast,
      currency: 'UZS',
    };

    await this.cache.set(cacheKey, result, 120);
    return result;
  }

  private calcPrepTimes(
    histories: { orderId: string; status: OrderStatus; createdAt: Date }[],
  ) {
    const byOrder = new Map<string, { confirmed?: Date; ready?: Date }>();
    for (const h of histories) {
      const o = byOrder.get(h.orderId) ?? {};
      if (h.status === 'CONFIRMED' && !o.confirmed) o.confirmed = h.createdAt;
      if (h.status === 'READY_FOR_PICKUP') o.ready = h.createdAt;
      byOrder.set(h.orderId, o);
    }
    const mins: number[] = [];
    for (const o of byOrder.values()) {
      if (o.confirmed && o.ready) {
        mins.push((o.ready.getTime() - o.confirmed.getTime()) / 60000);
      }
    }
    if (mins.length === 0) return { avg: 0, p90: 0, count: 0 };
    mins.sort((a, b) => a - b);
    const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
    const p90 = Math.round(mins[Math.floor(mins.length * 0.9)] ?? mins[mins.length - 1]);
    return { avg, p90, count: mins.length };
  }

  private aggregateReasons(reasons: (string | null)[]) {
    const counts = new Map<string, number>();
    for (const r of reasons) {
      const key = r?.includes('FAILED')
        ? 'failed_delivery'
        : r?.includes('OPS')
          ? 'operator_cancel'
          : r
            ? 'customer_other'
            : 'unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async calcRestaurantResponse(from: Date, to: Date) {
    const histories = await this.prisma.orderStatusHistory.findMany({
      where: {
        order: { createdAt: { gte: from, lte: to }, restaurantId: { not: null } },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: { orderId: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 8000,
    });
    const byOrder = new Map<string, { pending?: Date; confirmed?: Date }>();
    for (const h of histories) {
      const o = byOrder.get(h.orderId) ?? {};
      if (h.status === 'PENDING' && !o.pending) o.pending = h.createdAt;
      if (h.status === 'CONFIRMED') o.confirmed = h.createdAt;
      byOrder.set(h.orderId, o);
    }
    const mins: number[] = [];
    for (const o of byOrder.values()) {
      if (o.pending && o.confirmed) {
        mins.push((o.confirmed.getTime() - o.pending.getTime()) / 60_000);
      }
    }
    if (mins.length === 0) return { avgConfirmMinutes: 0, p90ConfirmMinutes: 0, sampleSize: 0 };
    mins.sort((a, b) => a - b);
    return {
      avgConfirmMinutes: Math.round(mins.reduce((a, b) => a + b, 0) / mins.length),
      p90ConfirmMinutes: Math.round(mins[Math.floor(mins.length * 0.9)] ?? mins[mins.length - 1]),
      sampleSize: mins.length,
    };
  }

  /** Simple same-weekday hour forecast */
  private async forecastPeakHours(from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
    });
    const byDowHour = new Map<string, number>();
    for (const o of orders) {
      const key = `${o.createdAt.getDay()}-${o.createdAt.getHours()}`;
      byDowHour.set(key, (byDowHour.get(key) ?? 0) + 1);
    }
    const now = new Date();
    const nextHours = [];
    for (let h = now.getHours(); h < now.getHours() + 4; h++) {
      const key = `${now.getDay()}-${h % 24}`;
      nextHours.push({ hour: h % 24, expectedOrders: byDowHour.get(key) ?? 0 });
    }
    return { next4Hours: nextHours, method: 'same_weekday_hour_average' };
  }
}
