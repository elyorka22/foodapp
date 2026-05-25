import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AuditService } from '../../common/services/audit.service';
import { TrackingGateway } from '../../gateways/tracking.gateway';
import { DispatchService } from '../dispatch/dispatch.service';
import { IncidentsService } from './incidents.service';
import { orderUrgency } from '../../common/utils/order-urgency';
import { orderSla } from '../../common/utils/order-sla';

@Injectable()
export class OpsService {
  constructor(
    private prisma: PrismaService,
    private orders: OrdersService,
    private audit: AuditService,
    private dispatch: DispatchService,
    private incidents: IncidentsService,
    private tracking: TrackingGateway,
    @InjectQueue('telegram') private telegramQueue: Queue,
    @InjectQueue('orders') private ordersQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async operationsHub() {
    const [board, dispatch, restaurants, queues, incidents] = await Promise.all([
      this.liveBoard(),
      this.dispatch.dispatchOverview(),
      this.restaurantMonitor(),
      this.queueSnapshot(),
      this.incidents(10),
    ]);
    return { board, dispatch, restaurants, queues, recentIncidents: incidents };
  }

  async liveBoard() {
    const activeStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'COURIER_ASSIGNED',
      'PICKED_UP',
      'ON_THE_WAY',
    ];
    const [orders, couriers] = await Promise.all([
      this.prisma.order.findMany({
        where: { status: { in: activeStatuses } },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          createdAt: true,
          estimatedDelivery: true,
          updatedAt: true,
          guestPhone: true,
          notes: true,
          distanceKm: true,
          courierId: true,
          restaurant: { select: { id: true, name: true, isOpen: true, latitude: true, longitude: true } },
          business: { select: { id: true, name: true, isOpen: true } },
          courier: {
            select: {
              id: true,
              currentLat: true,
              currentLng: true,
              user: { select: { firstName: true, phone: true } },
            },
          },
          deliveryAddress: { select: { street: true, city: true, latitude: true, longitude: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
        take: 150,
      }),
      this.prisma.courier.findMany({
        where: { status: { in: ['AVAILABLE', 'ON_DELIVERY', 'BUSY'] }, isVerified: true },
        select: {
          id: true,
          status: true,
          currentLat: true,
          currentLng: true,
          totalDeliveries: true,
          updatedAt: true,
          user: { select: { firstName: true, lastName: true, phone: true } },
          _count: { select: { orders: { where: { status: { in: ['COURIER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] } } } } },
        },
      }),
    ]);

    const enriched = orders.map((o) => {
      const urgency = orderUrgency(o.status, o.createdAt, !!o.courierId);
      const sla = orderSla(o.createdAt, o.estimatedDelivery, o.status);
      return { ...o, urgency, sla };
    });

    const byStatus = activeStatuses.map((status) => ({
      status,
      count: enriched.filter((o) => o.status === status).length,
      orders: enriched.filter((o) => o.status === status),
    }));

    const criticalCount = enriched.filter((o) => o.urgency.level === 'critical').length;

    return {
      orders: enriched,
      byStatus,
      couriers: couriers.map((c) => {
        const idleMinutes = Math.floor((Date.now() - c.updatedAt.getTime()) / 60_000);
        return {
          ...c,
          activeOrders: c._count.orders,
          idleMinutes,
          idleWarning: c.status === 'AVAILABLE' && c._count.orders === 0 && idleMinutes >= 30,
        };
      }),
      stats: {
        total: enriched.length,
        critical: criticalCount,
        unassignedReady: enriched.filter((o) => o.status === 'READY_FOR_PICKUP' && !o.courierId).length,
        slaBreached: enriched.filter((o) => o.sla.breached).length,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async restaurantMonitor() {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isOpen: true,
        slug: true,
        avgPrepMinutes: true,
        updatedAt: true,
        orders: {
          where: {
            status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] },
          },
          select: { id: true, status: true, createdAt: true, orderNumber: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    return restaurants.map((r) => {
      const pendingOrder = r.orders.find((o) => o.status === 'PENDING');
      const responseTimerMin = pendingOrder
        ? Math.floor((Date.now() - pendingOrder.createdAt.getTime()) / 60_000)
        : 0;
      return {
        id: r.id,
        name: r.name,
        isOpen: r.isOpen,
        activeOrders: r.orders.length,
        oldestWaitMin: r.orders[0]
          ? Math.floor((Date.now() - r.orders[0].createdAt.getTime()) / 60_000)
          : 0,
        responseTimerMin,
        responseWarning: responseTimerMin >= 10,
        orders: r.orders,
        needsAttention: (!r.isOpen && r.orders.length > 0) || responseTimerMin >= 15,
      };
    });
  }

  async queueSnapshot() {
    const [ordersQ, notifQ, telegramQ] = await Promise.all([
      this.ordersQueue.getJobCounts(),
      this.notificationsQueue.getJobCounts(),
      this.telegramQueue.getJobCounts(),
    ]);
    return {
      orders: ordersQ,
      notifications: notifQ,
      telegram: telegramQ,
      checkedAt: new Date().toISOString(),
    };
  }

  async suggestDispatch(orderId: string) {
    return this.dispatch.suggestCouriersForOrder(orderId);
  }

  async assignCourier(orderId: string, courierId: string, actorId: string) {
    const courier = await this.prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier?.isVerified) throw new BadRequestException('Courier not available');
    const order = await this.orders.assignCourier(orderId, courierId);
    await this.logOps(actorId, 'ops.courier.assign', orderId, { courierId });
    return order;
  }

  async reassignCourier(orderId: string, courierId: string, actorId: string, note?: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierId,
        status: OrderStatus.COURIER_ASSIGNED,
        statusHistory: { create: { status: OrderStatus.COURIER_ASSIGNED, note: note ?? 'Kuryer qayta tayinlandi' } },
      },
    });
    await this.logOps(actorId, 'ops.courier.reassign', orderId, { courierId, note });
    this.tracking.emitOrderStatus(orderId, OrderStatus.COURIER_ASSIGNED);
    return this.orders.findOne(orderId);
  }

  async retryFailedDelivery(orderId: string, actorId: string, note?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.READY_FOR_PICKUP,
        courierId: null,
        cancelReason: null,
        cancelledAt: null,
        statusHistory: {
          create: {
            status: OrderStatus.READY_FOR_PICKUP,
            note: note ?? '[OPS] Yetkazish qayta ishga tushirildi',
          },
        },
      },
    });
    await this.logOps(actorId, 'ops.order.retry_delivery', orderId, { note });
    this.tracking.emitOrderStatus(orderId, OrderStatus.READY_FOR_PICKUP);
    return this.orders.findOne(orderId);
  }

  async emergencyCancel(orderId: string, actorId: string, reason: string) {
    const order = await this.orders.updateStatus(
      orderId,
      { status: OrderStatus.CANCELLED, cancelReason: reason, note: `[OPS] ${reason}` },
      actorId,
      UserRole.ADMIN,
    );
    await this.logOps(actorId, 'ops.order.emergency_cancel', orderId, { reason });
    await this.telegramQueue.add('send', {
      event: 'admin.alert',
      text: `🚨 Bekor qilindi (OPS)\n${order.orderNumber}\n${reason}`,
    });
    return order;
  }

  async markFailed(orderId: string, actorId: string, reason: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: `[FAILED] ${reason}`,
        statusHistory: { create: { status: OrderStatus.CANCELLED, note: `Yetkazib berilmadi: ${reason}` } },
      },
    });
    await this.logOps(actorId, 'ops.order.failed', orderId, { reason });
    await this.incidents.create(
      {
        type: 'FAILED_DELIVERY',
        severity: 'HIGH',
        title: `Yetkazilmadi: ${order.orderNumber}`,
        description: reason,
        orderId,
        courierId: order.courierId ?? undefined,
      },
      actorId,
    );
    this.tracking.emitOrderStatus(orderId, OrderStatus.CANCELLED);
    return this.orders.findOne(orderId);
  }

  async addOperatorNote(orderId: string, actorId: string, note: string) {
    await this.prisma.orderStatusHistory.create({
      data: { orderId, status: OrderStatus.PENDING, note: `[OPS] ${note}` },
    });
    await this.logOps(actorId, 'ops.order.note', orderId, { note });
    return { ok: true };
  }

  async supportCustomer(orderId: string, actorId: string, action: string, payload?: Record<string, unknown>) {
    await this.logOps(actorId, `ops.support.customer.${action}`, orderId, payload);
    if (action === 'refund_flag') {
      await this.prisma.payment.updateMany({ where: { orderId }, data: { status: 'REFUNDED' } });
    }
    return { ok: true, action };
  }

  async incidents(limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { action: { startsWith: 'ops.' } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async suspiciousActivity(limit = 30) {
    return this.prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'failed' } },
          { action: { contains: 'emergency' } },
          { action: { contains: 'retry' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async logOps(actorId: string, action: string, orderId: string, metadata?: Record<string, unknown>) {
    await this.audit.log({
      actorId,
      actorRole: UserRole.ADMIN,
      action,
      entityType: 'Order',
      entityId: orderId,
      metadata,
    });
  }
}
