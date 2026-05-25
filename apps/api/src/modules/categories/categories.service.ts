import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  findByRestaurant(restaurantId: string) {
    return this.prisma.category.findMany({
      where: { restaurantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { products: { where: { isAvailable: true } } },
    });
  }

  findByBusiness(businessId: string) {
    return this.prisma.category.findMany({
      where: { businessId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { products: { where: { isAvailable: true } } },
    });
  }

  create(data: {
    name: string;
    slug: string;
    restaurantId?: string;
    businessId?: string;
    sortOrder?: number;
  }) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
    return this.prisma.category.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { isActive: false } });
  }
}
