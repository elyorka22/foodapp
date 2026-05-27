import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VendorType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePagination } from '../../common/utils/pagination';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { type?: VendorType; city?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 20,
      maxLimit: 50,
    });
    const where: Prisma.BusinessWhereInput = { isActive: true };
    if (query.type) where.type = query.type;
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.business.findMany({
        where,
        include: { openingHours: true, _count: { select: { products: true } } },
        orderBy: { rating: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.business.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const business = await this.prisma.business.findUnique({
      where: { slug },
      include: {
        openingHours: true,
        categories: { where: { isActive: true }, include: { products: { where: { isAvailable: true } } } },
      },
    });
    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async getInventory(businessId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { businessId },
      include: { product: true },
      orderBy: { quantity: 'asc' },
    });
  }

  async updateInventory(productId: string, quantity: number) {
    return this.prisma.inventoryItem.update({
      where: { productId },
      data: { quantity },
    });
  }
}
