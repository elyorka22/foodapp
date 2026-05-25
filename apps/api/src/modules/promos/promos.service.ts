import { Injectable, BadRequestException } from '@nestjs/common';
import { PromoType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PromosService {
  constructor(private prisma: PrismaService) {}

  async validate(code: string, subtotal: number) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.isActive) throw new BadRequestException('Invalid promo code');
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      throw new BadRequestException('Promo code expired');
    }
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
      throw new BadRequestException('Promo code limit reached');
    }
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      throw new BadRequestException(`Minimum order ${promo.minOrderAmount} required`);
    }

    let discount = 0;
    if (promo.type === PromoType.PERCENTAGE) {
      discount = subtotal * (promo.value / 100);
      if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    } else if (promo.type === PromoType.FIXED) {
      discount = promo.value;
    } else if (promo.type === PromoType.FREE_DELIVERY) {
      discount = 0;
    }

    return {
      id: promo.id,
      code: promo.code,
      discount: Math.round(discount * 100) / 100,
      type: promo.type,
      freeDelivery: promo.type === PromoType.FREE_DELIVERY,
    };
  }

  async findAll() {
    return this.prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: { code: string; type: PromoType; value: number; minOrderAmount?: number }) {
    return this.prisma.promoCode.create({
      data: { ...data, code: data.code.toUpperCase() },
    });
  }
}
