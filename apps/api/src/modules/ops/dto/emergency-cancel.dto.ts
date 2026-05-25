import { IsString, MinLength } from 'class-validator';

export class EmergencyCancelDto {
  @IsString()
  @MinLength(3)
  reason: string;
}
