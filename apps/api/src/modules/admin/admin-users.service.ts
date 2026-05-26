import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';
import { CreateStaffDto } from './dto/create-staff.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isGuest: true,
          createdAt: true,
          role: { select: { id: true, name: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async assignRole(actorId: string, userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const roleRow = await this.prisma.role.findUniqueOrThrow({ where: { name: role } });
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId: roleRow.id },
      select: {
        id: true,
        email: true,
        role: { select: { name: true } },
      },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.audit.log({
      action: 'user.role.assigned',
      entityType: 'User',
      entityId: userId,
      actorId,
      metadata: { role },
    });
    return updated;
  }

  async setActive(actorId: string, userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true },
    });
    if (!isActive) {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    await this.audit.log({
      action: isActive ? 'user.activated' : 'user.deactivated',
      entityType: 'User',
      entityId: userId,
      actorId,
    });
    return updated;
  }

  async createStaff(actorId: string, dto: CreateStaffDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: dto.role } });
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: role.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
      },
    });
    await this.audit.log({
      action: 'user.staff.created',
      entityType: 'User',
      entityId: user.id,
      actorId,
      metadata: { role: dto.role },
    });
    return { user, temporaryPassword: dto.password };
  }
}
