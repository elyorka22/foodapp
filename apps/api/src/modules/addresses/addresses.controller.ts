import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('addresses')
@Controller('addresses')
export class AddressesController {
  constructor(private addresses: AddressesService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateAddressDto, @CurrentUser() user?: { id: string }) {
    return this.addresses.create(dto, user?.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myAddresses(@CurrentUser() user: { id: string }) {
    return this.addresses.findForUser(user.id);
  }
}
