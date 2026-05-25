import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isGuest: true,
        role: { select: { id: true, name: true } },
        addresses: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async addAddress(userId: string, data: Record<string, unknown>) {
    return this.prisma.address.create({
      data: { ...data, userId } as never,
    });
  }
}
