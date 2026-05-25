import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({ data });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { isAvailable: false },
    });
  }

  async findByRestaurant(restaurantId: string) {
    return this.prisma.product.findMany({
      where: { restaurantId, isAvailable: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findByBusiness(businessId: string) {
    return this.prisma.product.findMany({
      where: { businessId, isAvailable: true },
      include: { inventory: true },
      orderBy: { sortOrder: 'asc' },
    });
  }
}
