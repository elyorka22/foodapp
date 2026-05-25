import { Body, Controller, Get, Patch, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }, @Query('unread') unread?: string) {
    return this.notifications.findByUser(user.id, unread === 'true');
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notifications.markRead(id, user.id);
  }

  @Post('device')
  registerDevice(
    @CurrentUser() user: { id: string },
    @Body() body: { token: string; platform: string },
  ) {
    return this.notifications.registerDevice(user.id, body.token, body.platform);
  }
}
