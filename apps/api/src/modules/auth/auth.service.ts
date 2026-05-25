import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { AuditService } from '../../common/services/audit.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
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
    return this.issueTokens(user.id, user.email, user.role.name);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { role: true },
    });
    if (!user?.passwordHash) {
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
    return this.issueTokens(user.id, user.email, user.role.name);
  }

  async guestSession() {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: UserRole.CUSTOMER } });
    const user = await this.prisma.user.create({
      data: { isGuest: true, roleId: role.id },
      include: { role: true },
    });
    return this.issueTokens(user.id, null, user.role.name);
  }

  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { role: true } } },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.user.id, stored.user.email, stored.user.role.name);
  }

  private async issueTokens(userId: string, email: string | null, role: UserRole) {
    const payload = { sub: userId, email, role };
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId, expiresAt },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isGuest: true,
        role: { select: { name: true } },
      },
    });
    return { accessToken, refreshToken, user };
  }
}
