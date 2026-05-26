import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { permissionsFromRoleJson } from '../../common/utils/role-permissions';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string | null;
    role: UserRole;
    permissions?: string[];
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    const permissions =
      payload.permissions?.length
        ? payload.permissions
        : permissionsFromRoleJson(user.role.permissions);
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      roleId: user.roleId,
      firstName: user.firstName,
      lastName: user.lastName,
      permissions,
    };
  }
}
