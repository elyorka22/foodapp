import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('admin-users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.MANAGER)
export class AdminUsersController {
  constructor(private adminUsers: AdminUsersService) {}

  @Get()
  @Permissions('manage_users')
  list(@Query() query: PaginationQueryDto) {
    return this.adminUsers.list(query.page, query.limit);
  }

  @Post('staff')
  @Roles(UserRole.ADMIN)
  @Permissions('manage_users')
  createStaff(@CurrentUser() actor: { id: string }, @Body() dto: CreateStaffDto) {
    return this.adminUsers.createStaff(actor.id, dto);
  }

  @Patch(':id/role')
  @Roles(UserRole.ADMIN)
  @Permissions('manage_roles')
  assignRole(
    @CurrentUser() actor: { id: string },
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.adminUsers.assignRole(actor.id, id, dto.role);
  }

  @Patch(':id/deactivate')
  @Permissions('manage_users')
  deactivate(@CurrentUser() actor: { id: string }, @Param('id') id: string) {
    return this.adminUsers.setActive(actor.id, id, false);
  }

  @Patch(':id/activate')
  @Permissions('manage_users')
  activate(@CurrentUser() actor: { id: string }, @Param('id') id: string) {
    return this.adminUsers.setActive(actor.id, id, true);
  }
}
