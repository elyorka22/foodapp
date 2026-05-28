import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { IncidentsService } from './incidents.service';
import { OrdersModule } from '../orders/orders.module';
import { DispatchModule } from '../dispatch/dispatch.module';

@Module({
  imports: [OrdersModule, DispatchModule],
  controllers: [OpsController],
  providers: [OpsService, IncidentsService],
  exports: [IncidentsService],
})
export class OpsModule {}
