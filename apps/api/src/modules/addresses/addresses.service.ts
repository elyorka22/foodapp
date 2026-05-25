import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAddressDto, userId?: string) {
    if (userId && dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label ?? 'Uy',
        street: dto.street,
        city: dto.city ?? 'Tashkent',
        district: dto.district,
        landmark: dto.landmark,
        postalCode: dto.postalCode ?? '100000',
        country: 'UZ',
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault ?? true,
      },
    });
  }

  async findForUser(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findDefaultTashkent() {
    return this.prisma.address.findFirst({
      where: { city: { contains: 'Tashkent', mode: 'insensitive' } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
