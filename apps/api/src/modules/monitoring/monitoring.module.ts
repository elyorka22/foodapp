import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MonitoringController } from './monitoring.controller';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'orders' },
      { name: 'notifications' },
      { name: 'telegram' },
    ),
  ],
  controllers: [MonitoringController],
})
export class MonitoringModule {}
