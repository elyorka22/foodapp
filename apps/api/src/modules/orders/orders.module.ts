import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DeliveryModule } from '../delivery/delivery.module';
import { PromosModule } from '../promos/promos.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DeliveryModule, PromosModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
