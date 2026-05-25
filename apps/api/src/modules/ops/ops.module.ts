import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { IncidentsService } from './incidents.service';
import { OrdersModule } from '../orders/orders.module';
import { TrackingModule } from '../../gateways/tracking.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [
    OrdersModule,
    TrackingModule,
    DispatchModule,
    BullModule.registerQueue({ name: 'telegram' }, { name: 'orders' }, { name: 'notifications' }),
  ],
  controllers: [OpsController],
  providers: [OpsService, IncidentsService],
  exports: [IncidentsService],
})
export class OpsModule {}
