import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OpsIncidentSeverity,
  OpsIncidentStatus,
  OpsIncidentType,
  OrderStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { RedisCacheService } from '../../common/services/redis-cache.service';
import { orderUrgency } from '../../common/utils/order-urgency';
import { orderSla } from '../../common/utils/order-sla';

export interface CreateIncidentInput {
  type: OpsIncidentType;
  severity?: OpsIncidentSeverity;
  title: string;
  description?: string;
  orderId?: string;
  courierId?: string;
  restaurantId?: string;
}

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private cache: RedisCacheService,
  ) {}

  async getIncidentCenter() {
    await this.syncAutoIncidents();
    const [open, inProgress, resolvedToday, byType, bySeverity] = await Promise.all([
      this.prisma.opsIncident.findMany({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        take: 100,
        include: {
          order: {
            select: {
              orderNumber: true,
              status: true,
              guestPhone: true,
              restaurant: { select: { name: true } },
              business: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.opsIncident.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.opsIncident.count({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.opsIncident.groupBy({
        by: ['type'],
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        _count: true,
      }),
      this.prisma.opsIncident.groupBy({
        by: ['severity'],
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        _count: true,
      }),
    ]);

    return {
      stats: {
        open: open.filter((i) => i.status === 'OPEN').length,
        inProgress,
        resolvedToday,
        critical: open.filter((i) => i.severity === 'CRITICAL').length,
      },
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      bySeverity: bySeverity.map((s) => ({ severity: s.severity, count: s._count })),
      incidents: open,
      updatedAt: new Date().toISOString(),
    };
  }

  async getOne(id: string) {
    const incident = await this.prisma.opsIncident.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            guestPhone: true,
            createdAt: true,
            restaurant: { select: { name: true } },
            business: { select: { name: true } },
          },
        },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    const timeline = await this.getTimeline(id);
    return { ...incident, timeline };
  }

  async getTimeline(incidentId: string) {
    const [audit, notes] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { entityType: 'OpsIncident', entityId: incidentId },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      this.prisma.orderStatusHistory.findMany({
        where: {
          order: { incidents: { some: { id: incidentId } } },
          note: { contains: '[OPS]' },
        },
        orderBy: { createdAt: 'asc' },
        take: 20,
      }),
    ]);
    const merged = [
      ...audit.map((a) => ({
        at: a.createdAt.toISOString(),
        kind: 'audit' as const,
        action: a.action,
        actorId: a.actorId,
        metadata: a.metadata,
      })),
      ...notes.map((n) => ({
        at: n.createdAt.toISOString(),
        kind: 'order_note' as const,
        action: n.status,
        note: n.note,
      })),
    ].sort((a, b) => a.at.localeCompare(b.at));
    return merged;
  }

  async create(input: CreateIncidentInput, actorId: string) {
    const incident = await this.prisma.opsIncident.create({
      data: {
        type: input.type,
        severity: input.severity ?? 'MEDIUM',
        title: input.title,
        description: input.description,
        orderId: input.orderId,
        courierId: input.courierId,
        restaurantId: input.restaurantId,
      },
    });
    await this.logIncident(actorId, 'incident.created', incident.id, input);
    return incident;
  }

  async updateStatus(
    id: string,
    status: OpsIncidentStatus,
    actorId: string,
    note?: string,
  ) {
    const incident = await this.prisma.opsIncident.update({
      where: { id },
      data: {
        status,
        ...(status === 'RESOLVED' || status === 'DISMISSED'
          ? { resolvedAt: new Date(), resolvedNote: note }
          : {}),
      },
    });
    await this.logIncident(actorId, `incident.status.${status.toLowerCase()}`, id, { note });
    return incident;
  }

  async resolve(id: string, actorId: string, note: string) {
    return this.updateStatus(id, 'RESOLVED', actorId, note);
  }

  async assign(id: string, assigneeId: string, actorId: string) {
    const incident = await this.prisma.opsIncident.update({
      where: { id },
      data: { assigneeId, status: 'IN_PROGRESS' },
    });
    await this.logIncident(actorId, 'incident.assigned', id, { assigneeId });
    return incident;
  }

  /** Auto-create incidents from live operational signals (deduped) */
  async syncAutoIncidents() {
    const lock = await this.cache.get<string>('incidents:sync:lock');
    if (lock) return;
    await this.cache.set('incidents:sync:lock', '1', 45);

    const activeStatuses: OrderStatus[] = [
      'PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'COURIER_ASSIGNED',
      'PICKED_UP',
      'ON_THE_WAY',
    ];

    const orders = await this.prisma.order.findMany({
      where: { status: { in: activeStatuses } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        estimatedDelivery: true,
        courierId: true,
        restaurantId: true,
        cancelReason: true,
        courier: { select: { id: true, status: true, updatedAt: true } },
      },
      take: 200,
    });

    for (const o of orders) {
      const urgency = orderUrgency(o.status, o.createdAt, !!o.courierId);
      const sla = orderSla(o.createdAt, o.estimatedDelivery, o.status);

      if (sla.breached) {
        await this.ensureIncident({
          type: 'DELAYED_ORDER',
          severity: 'HIGH',
          title: `SLA buzildi: ${o.orderNumber}`,
          description: urgency.reason ?? 'delivery_sla_breach',
          orderId: o.id,
          courierId: o.courierId ?? undefined,
          restaurantId: o.restaurantId ?? undefined,
        });
      } else if (urgency.level === 'critical') {
        await this.ensureIncident({
          type: 'DELAYED_ORDER',
          severity: 'CRITICAL',
          title: `Kechikish: ${o.orderNumber}`,
          description: urgency.reason,
          orderId: o.id,
          courierId: o.courierId ?? undefined,
          restaurantId: o.restaurantId ?? undefined,
        });
      }

      if (o.status === 'PENDING' && urgency.minutesWaiting >= 10) {
        await this.ensureIncident({
          type: 'RESTAURANT_ISSUE',
          severity: urgency.minutesWaiting >= 20 ? 'HIGH' : 'MEDIUM',
          title: `Restoran javob bermayapti: ${o.orderNumber}`,
          description: 'pending_confirmation',
          orderId: o.id,
          restaurantId: o.restaurantId ?? undefined,
        });
      }

      if (o.status === 'READY_FOR_PICKUP' && !o.courierId && urgency.minutesWaiting >= 8) {
        await this.ensureIncident({
          type: 'COURIER_ISSUE',
          severity: urgency.minutesWaiting >= 15 ? 'CRITICAL' : 'MEDIUM',
          title: `Kuryer tayinlanmagan: ${o.orderNumber}`,
          description: 'awaiting_courier',
          orderId: o.id,
          restaurantId: o.restaurantId ?? undefined,
        });
      }
    }

    const idleCouriers = await this.prisma.courier.findMany({
      where: { status: 'AVAILABLE', isVerified: true },
      select: {
        id: true,
        updatedAt: true,
        user: { select: { firstName: true } },
        _count: { select: { orders: { where: { status: { in: ['COURIER_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'] } } } } },
      },
    });

    for (const c of idleCouriers) {
      const idleMin = Math.floor((Date.now() - c.updatedAt.getTime()) / 60_000);
      if (c._count.orders === 0 && idleMin >= 45) {
        await this.ensureIncident({
          type: 'COURIER_ISSUE',
          severity: 'LOW',
          title: `Kuryer kutmoqda: ${c.user.firstName}`,
          description: `idle_${idleMin}m`,
          courierId: c.id,
        });
      }
    }

    const failedOrders = await this.prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        cancelReason: { contains: 'FAILED' },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) },
      },
      select: { id: true, orderNumber: true, cancelReason: true, courierId: true },
      take: 20,
    });

    for (const o of failedOrders) {
      await this.ensureIncident({
        type: 'FAILED_DELIVERY',
        severity: 'HIGH',
        title: `Yetkazilmadi: ${o.orderNumber}`,
        description: o.cancelReason ?? undefined,
        orderId: o.id,
        courierId: o.courierId ?? undefined,
      });
    }
  }

  private async ensureIncident(data: CreateIncidentInput) {
    const existing = await this.prisma.opsIncident.findFirst({
      where: {
        type: data.type,
        orderId: data.orderId ?? undefined,
        courierId: data.orderId ? undefined : data.courierId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });
    if (existing) return existing;

    return this.prisma.opsIncident.create({
      data: {
        type: data.type,
        severity: data.severity ?? 'MEDIUM',
        title: data.title,
        description: data.description,
        orderId: data.orderId,
        courierId: data.courierId,
        restaurantId: data.restaurantId,
        metadata: { source: 'auto_sync' },
      },
    });
  }

  private async logIncident(
    actorId: string,
    action: string,
    incidentId: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.audit.log({
      actorId,
      actorRole: UserRole.ADMIN,
      action,
      entityType: 'OpsIncident',
      entityId: incidentId,
      metadata,
    });
  }
}
