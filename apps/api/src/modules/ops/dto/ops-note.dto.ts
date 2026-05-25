import { IsString, MinLength } from 'class-validator';

export class OpsNoteDto {
  @IsString()
  @MinLength(2)
  note: string;
}
