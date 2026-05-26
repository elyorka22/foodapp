import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

const STAFF_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATOR, UserRole.COURIER] as const;

export class CreateStaffDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(STAFF_ROLES)
  role!: (typeof STAFF_ROLES)[number];

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
