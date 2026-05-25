import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OrderStatus, Prisma, PromoType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DeliveryService } from '../delivery/delivery.service';
import { PromosService } from '../promos/promos.service';
import { TelegramService, formatUzs } from '../telegram/telegram.service';
import { AuditService } from '../../common/services/audit.service';
import { isVendorOpen } from '../../common/utils/vendor-hours';
import { TrackingGateway } from '../../gateways/tracking.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

const STATUS_FLOW: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COURIER_ASSIGNED', 'CANCELLED'],
  COURIER_ASSIGNED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

const CANCELLABLE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING'];

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private delivery: DeliveryService,
    private promos: PromosService,
    private telegram: TelegramService,
    private audit: AuditService,
    private tracking: TrackingGateway,
    @InjectQueue('orders') private ordersQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('telegram') private telegramQueue: Queue,
  ) {}

  async create(dto: CreateOrderDto, customerId?: string) {
    if (!dto.restaurantId && !dto.businessId) {
      throw new BadRequestException('Vendor required');
    }

    const vendor = dto.restaurantId
      ? await this.prisma.restaurant.findUnique({
          where: { id: dto.restaurantId },
          include: { openingHours: true },
        })
      : await this.prisma.business.findUnique({
          where: { id: dto.businessId },
          include: { openingHours: true },
        });
    if (!vendor || !vendor.isActive) throw new NotFoundException('Vendor not found');
    if (!vendor.isOpen) throw new BadRequestException('Do\'kon hozir yopiq');

    const tz = 'timezone' in vendor ? vendor.timezone : 'Asia/Tashkent';
    if (!isVendorOpen(vendor.openingHours, tz)) {
      throw new BadRequestException('Ish vaqti tugagan — hozir buyurtma qabul qilinmaydi');
    }

    const address = await this.prisma.address.findUnique({ where: { id: dto.deliveryAddressId } });
    if (!address) throw new NotFoundException('Address not found');

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
      include: { optionGroups: { include: { options: { where: { isAvailable: true } } } } },
    });
    if (products.length !== productIds.length) throw new BadRequestException('Invalid products');

    let subtotal = 0;
    const lineItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      let unitPrice = product.price;
      const selectedLabels: string[] = [];
      if (item.optionIds?.length) {
        for (const gid of product.optionGroups) {
          for (const opt of gid.options) {
            if (item.optionIds.includes(opt.id)) {
              unitPrice += opt.priceDelta;
              selectedLabels.push(opt.name);
            }
          }
        }
      }
      const lineSubtotal = unitPrice * item.quantity;
      subtotal += lineSubtotal;
      return {
        productId: item.productId,
        name: product.name,
        price: unitPrice,
        quantity: item.quantity,
        options: selectedLabels.length ? { selected: selectedLabels, optionIds: item.optionIds } : undefined,
        subtotal: lineSubtotal,
      };
    });

    const quote = await this.delivery.getQuote(
      vendor.latitude,
      vendor.longitude,
      address.latitude,
      address.longitude,
    );

    if (subtotal < vendor.minOrderAmount) {
      throw new BadRequestException(
        `Minimal buyurtma ${formatUzs(vendor.minOrderAmount)}`,
      );
    }
    if (subtotal < quote.minOrderAmount) {
      throw new BadRequestException(
        `Minimal buyurtma ${formatUzs(quote.minOrderAmount)}`,
      );
    }

    let discountAmount = 0;
    let deliveryFee = quote.deliveryFee;
    let promoCodeId: string | undefined;
    let promoType: PromoType | undefined;
    if (dto.promoCode) {
      const promo = await this.promos.validate(dto.promoCode, subtotal);
      discountAmount = promo.discount;
      promoCodeId = promo.id;
      promoType = promo.type;
      if (promo.type === PromoType.FREE_DELIVERY) {
        deliveryFee = 0;
        discountAmount = quote.deliveryFee;
      }
    }

    const taxAmount = 0;
    const total = Math.round((subtotal + deliveryFee - discountAmount) * 100) / 100;
    const orderNumber = `FM-${Date.now().toString(36).toUpperCase()}`;

    const estMinutes = quote.estimatedMinutes;
    const estimatedDelivery =
      dto.scheduledFor && dto.fulfillmentType === 'SCHEDULED'
        ? new Date(dto.scheduledFor)
        : new Date(Date.now() + estMinutes * 60000);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        guestEmail: dto.guestEmail,
        guestPhone: dto.guestPhone,
        guestName: dto.guestName,
        restaurantId: dto.restaurantId,
        businessId: dto.businessId,
        deliveryAddressId: dto.deliveryAddressId,
        subtotal,
        deliveryFee,
        discountAmount,
        taxAmount,
        total,
        distanceKm: quote.distanceKm,
        promoCodeId,
        notes: dto.notes,
        fulfillmentType: dto.fulfillmentType ?? 'ASAP',
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        currency: 'UZS',
        estimatedDelivery,
        items: { create: lineItems },
        statusHistory: { create: { status: OrderStatus.PENDING } },
        payment: {
          create: {
            amount: total,
            method: dto.paymentMethod ?? 'CASH',
            status: 'PENDING',
          },
        },
      },
      include: {
        items: true,
        payment: true,
        deliveryAddress: true,
        restaurant: { select: { name: true } },
        business: { select: { name: true } },
      },
    });

    if (promoCodeId) {
      await this.prisma.promoCode.update({
        where: { id: promoCodeId },
        data: { usedCount: { increment: 1 } },
      });
    }

    await this.postOrderEvents(order, 'order.new');
    return order;
  }

  async findAll(filters: {
    customerId?: string;
    restaurantId?: string;
    businessId?: string;
    courierId?: string;
    status?: OrderStatus;
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const where: Prisma.OrderWhereInput = {};
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.restaurantId) where.restaurantId = filters.restaurantId;
    if (filters.businessId) where.businessId = filters.businessId;
    if (filters.courierId) where.courierId = filters.courierId;
    if (filters.status) where.status = filters.status;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: true,
          deliveryAddress: true,
          restaurant: { select: { name: true, slug: true } },
          business: { select: { name: true, slug: true } },
          courier: { include: { user: { select: { firstName: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        deliveryAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        courier: { include: { user: { select: { firstName: true, lastName: true, phone: true } } } },
        restaurant: true,
        business: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async cancel(id: string, dto: CancelOrderDto, userId?: string, role?: string) {
    const order = await this.findOne(id);
    if (!CANCELLABLE.includes(order.status)) {
      throw new BadRequestException('Buyurtmani bekor qilib bo\'lmaydi');
    }
    if (userId && order.customerId && order.customerId !== userId && role !== 'ADMIN') {
      throw new BadRequestException('Ruxsat yo\'q');
    }
    return this.updateStatus(id, {
      status: OrderStatus.CANCELLED,
      cancelReason: dto.reason,
      note: dto.reason,
    });
  }

  async reorder(orderId: string, customerId?: string) {
    const prev = await this.findOne(orderId);
    if (customerId && prev.customerId !== customerId) {
      throw new BadRequestException('Ruxsat yo\'q');
    }
    return this.create(
      {
        restaurantId: prev.restaurantId ?? undefined,
        businessId: prev.businessId ?? undefined,
        deliveryAddressId: prev.deliveryAddressId,
        items: prev.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          optionIds: (i.options as { optionIds?: string[] })?.optionIds,
        })),
        paymentMethod: prev.payment?.method,
      },
      customerId ?? prev.customerId ?? undefined,
    );
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, actorId?: string, actorRole?: string) {
    const order = await this.findOne(id);
    const allowed = STATUS_FLOW[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${dto.status}`);
    }

    const courierEarning =
      dto.status === OrderStatus.DELIVERED && order.distanceKm
        ? Math.round(order.distanceKm * 5000 + 10000)
        : undefined;

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        deliveredAt: dto.status === OrderStatus.DELIVERED ? new Date() : undefined,
        cancelledAt: dto.status === OrderStatus.CANCELLED ? new Date() : undefined,
        cancelReason: dto.cancelReason,
        courierEarning,
        statusHistory: { create: { status: dto.status, note: dto.note } },
      },
      include: {
        items: true,
        customer: true,
        deliveryAddress: true,
        restaurant: { select: { name: true } },
        business: { select: { name: true } },
        courier: { include: { user: true } },
      },
    });

    if (dto.status === OrderStatus.DELIVERED && updated.courierId) {
      await this.prisma.courier.update({
        where: { id: updated.courierId },
        data: {
          totalDeliveries: { increment: 1 },
          status: 'AVAILABLE',
        },
      });
    }

    this.tracking.emitOrderStatus(id, dto.status, { orderNumber: updated.orderNumber });
    await this.audit.log({
      actorId,
      actorRole: actorRole as never,
      action: 'order.status.update',
      entityType: 'Order',
      entityId: id,
      metadata: { from: order.status, to: dto.status },
    });

    await this.ordersQueue.add('status-changed', { orderId: id, status: dto.status });
    await this.postOrderEvents(updated, 'order.status');

    return updated;
  }

  async assignCourier(orderId: string, courierId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        courierId,
        status: OrderStatus.COURIER_ASSIGNED,
        statusHistory: { create: { status: OrderStatus.COURIER_ASSIGNED } },
      },
      include: { restaurant: true, business: true, courier: { include: { user: true } } },
    });
    await this.prisma.courier.update({
      where: { id: courierId },
      data: { status: 'ON_DELIVERY' },
    });
    await this.telegramQueue.add('send', {
      event: 'courier.assigned',
      text: `🚴 Kuryer tayinlandi\n${order.orderNumber}\n${order.courier?.user.firstName ?? ''}`,
    });
    this.tracking.emitOrderStatus(orderId, OrderStatus.COURIER_ASSIGNED);
    return order;
  }

  private async postOrderEvents(
    order: {
      id: string;
      orderNumber: string;
      total: number;
      status: string;
      restaurant?: { name: string } | null;
      business?: { name: string } | null;
      deliveryAddress?: { street: string; city: string } | null;
      customerId?: string | null;
    },
    type: string,
  ) {
    await this.ordersQueue.add(type, { orderId: order.id, status: order.status });
    const vendorName = order.restaurant?.name ?? order.business?.name;
    const address = order.deliveryAddress
      ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`
      : undefined;

    await this.telegramQueue.add('send', {
      event: type === 'order.new' ? 'order.new' : 'order.status',
      text: this.telegram.formatOrderAlert({
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        vendorName,
        address,
      }),
    });

    if (order.customerId) {
      await this.notificationsQueue.add('push', {
        userId: order.customerId,
        title: type === 'order.new' ? 'Buyurtma qabul qilindi' : 'Buyurtma yangilandi',
        body: `${order.orderNumber}: ${order.status}`,
        data: { orderId: order.id, status: order.status },
      });
    }
  }
}
