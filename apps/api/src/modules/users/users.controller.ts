import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.users.findOne(user.id);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: { id: string }, @Body() body: Record<string, unknown>) {
    return this.users.updateProfile(user.id, body);
  }

  @Post('me/addresses')
  addAddress(@CurrentUser() user: { id: string }, @Body() body: Record<string, unknown>) {
    return this.users.addAddress(user.id, body);
  }
}
