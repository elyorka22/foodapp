import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { OpsModule } from './modules/ops/ops.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CouriersModule } from './modules/couriers/couriers.module';
import { TrackingModule } from './gateways/tracking.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromosModule } from './modules/promos/promos.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CategoriesModule } from './modules/categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60000, limit: 100 },
      { name: 'auth', ttl: 60000, limit: 15 },
      { name: 'upload', ttl: 60000, limit: 20 },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
    CommonModule,
    TelegramModule,
    PrismaModule,
    TrackingModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    RestaurantsModule,
    BusinessesModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    CouriersModule,
    PaymentsModule,
    ReviewsModule,
    PromosModule,
    NotificationsModule,
    AnalyticsModule,
    DeliveryModule,
    UploadsModule,
    OpsModule,
    MonitoringModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
