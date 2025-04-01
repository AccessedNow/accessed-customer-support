import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { FileDto } from 'src/modules/tickets/dto/create-ticket.dto';

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsOptional()
  files?: FileDto[];
}
