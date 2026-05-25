import { Injectable, NotFoundException } from '@nestjs/common';
import { CourierStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CouriersService {
  constructor(private prisma: PrismaService) {}

  async findAvailable() {
    return this.prisma.courier.findMany({
      where: { status: CourierStatus.AVAILABLE, isVerified: true },
      include: { user: { select: { firstName: true, lastName: true, phone: true } } },
    });
  }

  async findOne(id: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true, avatarUrl: true } },
        locations: { orderBy: { createdAt: 'desc' }, take: 100 },
      },
    });
    if (!courier) throw new NotFoundException('Courier not found');
    return courier;
  }

  async updateStatus(courierId: string, status: CourierStatus) {
    return this.prisma.courier.update({
      where: { id: courierId },
      data: { status },
    });
  }

  async getActiveOrders(courierId: string) {
    return this.prisma.order.findMany({
      where: {
        courierId,
        status: { in: ['COURIER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] },
      },
      include: { deliveryAddress: true, items: true, restaurant: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUserId(userId: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!courier) throw new NotFoundException('Courier profile not found');
    return courier;
  }

  async getEarnings(courierId: string, from?: string, to?: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
    const toDate = to ? new Date(to) : new Date();
    const orders = await this.prisma.order.findMany({
      where: {
        courierId,
        status: 'DELIVERED',
        deliveredAt: { gte: fromDate, lte: toDate },
      },
      select: {
        id: true,
        orderNumber: true,
        courierEarning: true,
        distanceKm: true,
        deliveredAt: true,
        total: true,
      },
    });
    const totalEarnings = orders.reduce((s, o) => s + (o.courierEarning ?? 0), 0);
    const totalKm = orders.reduce((s, o) => s + (o.distanceKm ?? 0), 0);
    return {
      orders: orders.length,
      totalEarnings,
      totalKm: Math.round(totalKm * 100) / 100,
      currency: 'UZS',
      items: orders,
    };
  }

  async completeDelivery(orderId: string, courierId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, courierId },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getRouteHistory(courierId: string, hours = 24) {
    const since = new Date(Date.now() - hours * 3600000);
    return this.prisma.courierLocation.findMany({
      where: { courierId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
  }
}
