import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { scoreCourier } from '../../common/utils/dispatch-score';
import { haversineKm } from '../../common/utils/distance';

@Injectable()
export class DispatchService {
  constructor(private prisma: PrismaService) {}

  /** Suggested couriers for manual assignment — not auto-assigned */
  async suggestCouriersForOrder(orderId: string, limit = 5) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        deliveryAddress: true,
        restaurant: true,
        business: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');

    const vendor = order.restaurant ?? order.business;
    if (!vendor) throw new NotFoundException('Vendor not found');

    const ctx = {
      pickupLat: vendor.latitude,
      pickupLng: vendor.longitude,
      destLat: order.deliveryAddress.latitude,
      destLng: order.deliveryAddress.longitude,
      city: vendor.city,
    };

    const couriers = await this.prisma.courier.findMany({
      where: {
        isVerified: true,
        status: { in: ['AVAILABLE', 'ON_DELIVERY', 'BUSY'] },
      },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        orders: {
          where: { status: { in: ['COURIER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] } },
          select: { id: true },
        },
      },
    });

    const zone = await this.prisma.deliveryZone.findFirst({
      where: { isActive: true, city: { contains: vendor.city, mode: 'insensitive' } },
    });

    const scored = couriers.map((c) => {
      const { score, distanceKm, reasons } = scoreCourier(
        {
          id: c.id,
          status: c.status,
          currentLat: c.currentLat,
          currentLng: c.currentLng,
          rating: c.rating,
          activeOrders: c.orders.length,
          totalDeliveries: c.totalDeliveries,
          firstName: c.user.firstName ?? undefined,
        },
        ctx,
      );
      const inZone =
        zone && c.currentLat != null && c.currentLng != null
          ? haversineKm(zone.centerLat, zone.centerLng, c.currentLat, c.currentLng) <= zone.radiusKm
          : true;
      return {
        courierId: c.id,
        name: `${c.user.firstName ?? ''} ${c.user.lastName ?? ''}`.trim(),
        phone: c.user.phone,
        status: c.status,
        score: inZone ? score : Math.max(0, score - 25),
        distanceKm,
        activeOrders: c.orders.length,
        reasons: inZone ? reasons : [...reasons, 'outside_zone'],
        manualOnly: true,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      orderId,
      orderNumber: order.orderNumber,
      pickup: { lat: ctx.pickupLat, lng: ctx.pickupLng, name: vendor.name },
      delivery: {
        lat: ctx.destLat,
        lng: ctx.destLng,
        street: order.deliveryAddress.street,
      },
      distanceKm: haversineKm(ctx.pickupLat, ctx.pickupLng, ctx.destLat, ctx.destLng),
      zone: zone?.name ?? null,
      suggestions: scored.slice(0, limit),
      batchingPrep: {
        note: 'Batching not enabled — group nearby READY orders manually',
        nearbyReadyCount: await this.countNearbyReady(ctx.pickupLat, ctx.pickupLng),
      },
    };
  }

  /** Load snapshot for dispatch desk */
  async dispatchOverview() {
    const [available, busy, unassignedReady] = await Promise.all([
      this.prisma.courier.count({ where: { status: 'AVAILABLE', isVerified: true } }),
      this.prisma.courier.count({ where: { status: { in: ['ON_DELIVERY', 'BUSY'] } } }),
      this.prisma.order.count({
        where: { status: 'READY_FOR_PICKUP', courierId: null },
      }),
    ]);
    return { availableCouriers: available, busyCouriers: busy, unassignedReady };
  }

  private async countNearbyReady(pickupLat: number, pickupLng: number) {
    const ready = await this.prisma.order.findMany({
      where: { status: 'READY_FOR_PICKUP', courierId: null },
      include: { restaurant: true, business: true },
      take: 20,
    });
    return ready.filter((o) => {
      const v = o.restaurant ?? o.business;
      if (!v) return false;
      return haversineKm(pickupLat, pickupLng, v.latitude, v.longitude) < 1.5;
    }).length;
  }
}
