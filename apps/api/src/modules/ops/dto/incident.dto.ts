import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OpsIncidentSeverity, OpsIncidentStatus, OpsIncidentType } from '@prisma/client';

export class CreateIncidentDto {
  @IsEnum(OpsIncidentType)
  type: OpsIncidentType;

  @IsOptional()
  @IsEnum(OpsIncidentSeverity)
  severity?: OpsIncidentSeverity;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  courierId?: string;

  @IsOptional()
  @IsString()
  restaurantId?: string;
}

export class UpdateIncidentStatusDto {
  @IsEnum(OpsIncidentStatus)
  status: OpsIncidentStatus;

  @IsOptional()
  @IsString()
  note?: string;
}

export class ResolveIncidentDto {
  @IsString()
  note: string;
}

export class AssignIncidentDto {
  @IsString()
  assigneeId: string;
}
