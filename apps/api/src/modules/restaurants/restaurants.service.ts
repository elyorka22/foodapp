import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizePagination } from '../../common/utils/pagination';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { city?: string; featured?: boolean; page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination({
      page: query.page,
      limit: query.limit,
      defaultLimit: 20,
      maxLimit: 50,
    });
    const where: Prisma.RestaurantWhereInput = { isActive: true };
    if (query.city) where.city = { contains: query.city, mode: 'insensitive' };
    if (query.featured) where.isFeatured = true;

    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        include: { openingHours: true, _count: { select: { products: true } } },
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.restaurant.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { slug },
      include: {
        openingHours: true,
        menus: {
          where: { isActive: true },
          include: {
            products: {
              where: { isAvailable: true },
              include: {
                optionGroups: {
                  include: { options: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } } },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        categories: { where: { isActive: true } },
      },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { menus: true, openingHours: true },
    });
    if (!restaurant) throw new NotFoundException('Restaurant not found');
    return restaurant;
  }

  async update(id: string, data: Prisma.RestaurantUpdateInput) {
    return this.prisma.restaurant.update({ where: { id }, data });
  }
}
