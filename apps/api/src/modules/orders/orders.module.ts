import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { DeliveryModule } from '../delivery/delivery.module';
import { PromosModule } from '../promos/promos.module';
import { TrackingModule } from '../../gateways/tracking.module';

@Module({
  imports: [
    DeliveryModule,
    PromosModule,
    forwardRef(() => TrackingModule),
    BullModule.registerQueue(
      { name: 'orders' },
      { name: 'notifications' },
      { name: 'telegram' },
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
