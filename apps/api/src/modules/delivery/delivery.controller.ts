import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeliveryService } from './delivery.service';

@ApiTags('delivery')
@Controller('delivery')
export class DeliveryController {
  constructor(private delivery: DeliveryService) {}

  @Get('quote')
  quote(
    @Query('vendorLat') vendorLat: number,
    @Query('vendorLng') vendorLng: number,
    @Query('destLat') destLat: number,
    @Query('destLng') destLng: number,
  ) {
    return this.delivery.getQuote(+vendorLat, +vendorLng, +destLat, +destLng);
  }
}
