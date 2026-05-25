import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async confirm(orderId: string, transactionId?: string) {
    const payment = await this.prisma.payment.findUnique({ where: { orderId } });
    if (!payment) throw new NotFoundException('Payment not found');
    return this.prisma.payment.update({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        transactionId,
        paidAt: new Date(),
      },
    });
  }
}
