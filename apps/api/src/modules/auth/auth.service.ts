import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { permissionsFromRoleJson } from '../../common/utils/role-permissions';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private audit: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (exists) throw new ConflictException('Email already registered');
    }
    const role = await this.prisma.role.findUniqueOrThrow({
      where: { name: dto.role ?? UserRole.CUSTOMER },
    });
    const passwordHash = dto.password ? await bcrypt.hash(dto.password, 12) : null;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roleId: role.id,
      },
      include: { role: true },
    });
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user?.passwordHash || !user.isActive) {
      await this.audit.log({
        action: 'auth.login.failed',
        entityType: 'User',
        metadata: { email: dto.email, reason: 'unknown_user' },
      }).catch(() => {});
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      await this.audit.log({
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: dto.email },
      }).catch(() => {});
      this.logger.warn(`Failed login attempt for ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.audit.log({
      action: 'auth.login.success',
      entityType: 'User',
      entityId: user.id,
      actorId: user.id,
    }).catch(() => {});
    return this.issueTokens(user.id);
  }

  async guestSession() {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: UserRole.CUSTOMER } });
    const user = await this.prisma.user.create({
      data: { isGuest: true, roleId: role.id },
      include: { role: true },
    });
    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });
    if (!stored || stored.expiresAt < new Date() || !stored.user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user.id);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { userId, token: refreshToken } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }
    await this.audit.log({
      action: 'auth.logout',
      entityType: 'User',
      entityId: userId,
      actorId: userId,
    }).catch(() => {});
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    const permissions = permissionsFromRoleJson(user.role.permissions);
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isGuest: user.isGuest,
      role: user.role.name,
      permissions,
    };
  }

  private async issueTokens(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException('User inactive');

    const permissions = permissionsFromRoleJson(user.role.permissions);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
      permissions,
    };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
      },
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isGuest: user.isGuest,
        role: { name: user.role.name },
        permissions,
      },
    };
  }
}
