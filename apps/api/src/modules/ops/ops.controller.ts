import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { OpsService } from './ops.service';
import { IncidentsService } from './incidents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssignCourierDto } from './dto/assign-courier.dto';
import { OpsNoteDto } from './dto/ops-note.dto';
import { EmergencyCancelDto } from './dto/emergency-cancel.dto';

@ApiTags('ops')
@Controller('ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class OpsController {
  constructor(
    private ops: OpsService,
    private incidents: IncidentsService,
  ) {}

  @Get('hub')
  hub() {
    return this.ops.operationsHub();
  }

  @Get('live-board')
  liveBoard() {
    return this.ops.liveBoard();
  }

  @Get('restaurants')
  restaurants() {
    return this.ops.restaurantMonitor();
  }

  @Get('queues')
  queues() {
    return this.ops.queueSnapshot();
  }

  @Get('orders/:id/dispatch-suggest')
  dispatchSuggest(@Param('id') id: string) {
    return this.ops.suggestDispatch(id);
  }

  @Get('incidents/center')
  incidentCenter() {
    return this.incidents.getIncidentCenter();
  }

  @Get('incidents/:id')
  incidentDetail(@Param('id') id: string) {
    return this.incidents.getOne(id);
  }

  @Get('incidents/:id/timeline')
  incidentTimeline(@Param('id') id: string) {
    return this.incidents.getTimeline(id);
  }

  @Post('incidents')
  createIncident(@Body() dto: CreateIncidentDto, @CurrentUser() user: { id: string }) {
    return this.incidents.create(dto, user.id);
  }

  @Post('incidents/:id/status')
  updateIncidentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateIncidentStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.incidents.updateStatus(id, dto.status, user.id, dto.note);
  }

  @Post('incidents/:id/resolve')
  resolveIncident(
    @Param('id') id: string,
    @Body() dto: ResolveIncidentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.incidents.resolve(id, user.id, dto.note);
  }

  @Post('incidents/:id/assign')
  assignIncident(
    @Param('id') id: string,
    @Body() dto: AssignIncidentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.incidents.assign(id, dto.assigneeId, user.id);
  }

  @Get('incidents-audit')
  incidentsAudit(@Query('limit') limit?: number) {
    return this.ops.incidents(Number(limit) || 50);
  }

  @Get('suspicious')
  suspicious(@Query('limit') limit?: number) {
    return this.ops.suspiciousActivity(Number(limit) || 30);
  }

  @Post('orders/:id/assign-courier')
  assignCourier(@Param('id') id: string, @Body() dto: AssignCourierDto, @CurrentUser() user: { id: string }) {
    return this.ops.assignCourier(id, dto.courierId, user.id);
  }

  @Post('orders/:id/reassign-courier')
  reassign(@Param('id') id: string, @Body() dto: AssignCourierDto, @CurrentUser() user: { id: string }) {
    return this.ops.reassignCourier(id, dto.courierId, user.id, dto.note);
  }

  @Post('orders/:id/retry-delivery')
  retryDelivery(@Param('id') id: string, @Body() dto: OpsNoteDto, @CurrentUser() user: { id: string }) {
    return this.ops.retryFailedDelivery(id, user.id, dto.note);
  }

  @Post('orders/:id/emergency-cancel')
  emergencyCancel(@Param('id') id: string, @Body() dto: EmergencyCancelDto, @CurrentUser() user: { id: string }) {
    return this.ops.emergencyCancel(id, user.id, dto.reason);
  }

  @Post('orders/:id/mark-failed')
  markFailed(@Param('id') id: string, @Body() dto: EmergencyCancelDto, @CurrentUser() user: { id: string }) {
    return this.ops.markFailed(id, user.id, dto.reason);
  }

  @Post('orders/:id/note')
  note(@Param('id') id: string, @Body() dto: OpsNoteDto, @CurrentUser() user: { id: string }) {
    return this.ops.addOperatorNote(id, user.id, dto.note);
  }

  @Post('orders/:id/support')
  support(
    @Param('id') id: string,
    @Body() body: { action: string; payload?: Record<string, unknown> },
    @CurrentUser() user: { id: string },
  ) {
    return this.ops.supportCustomer(id, user.id, body.action, body.payload);
  }
}
