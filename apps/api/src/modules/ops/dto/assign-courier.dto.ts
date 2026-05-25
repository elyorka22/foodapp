import { IsOptional, IsString } from 'class-validator';

export class AssignCourierDto {
  @IsString()
  courierId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
