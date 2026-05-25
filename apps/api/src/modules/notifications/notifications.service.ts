import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toInputJsonValue } from '../../common/utils/prisma-json';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async registerDevice(userId: string, token: string, platform: string) {
    return this.prisma.deviceToken.upsert({
      where: { userId_token: { userId, token } },
      update: { platform },
      create: { userId, token, platform },
    });
  }

  async createInApp(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: 'ORDER_UPDATE',
        title,
        body,
        data: toInputJsonValue(data),
      },
    });
  }
}
