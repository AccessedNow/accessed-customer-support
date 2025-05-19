import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Priority, TICKET_TYPE, TICKET_SUBTYPE } from 'src/common/enums/ticket.enum';
import { CustomerInfoDto } from './customer-info.dto';

export class CreateTicketDto extends CustomerInfoDto {
  @IsOptional()
  @IsString()
  assigneeId: string;

  @ApiProperty({
    description: 'Subject of the ticket',
    example: 'Defective Item Received',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  subject: string;

  @ApiProperty({
    description: 'Message body of the ticket',
    example: 'I received a defective product and would like a replacement.',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  message: string;

  @ApiProperty({
    description: 'Type of ticket',
    enum: TICKET_TYPE,
    example: TICKET_TYPE.ACCOUNT,
    default: TICKET_TYPE.ACCOUNT,
  })
  @IsEnum(TICKET_TYPE)
  @IsNotEmpty()
  ticketType: string;

  @ApiProperty({
    description: 'Subtype of ticket',
    enum: TICKET_SUBTYPE,
    example: TICKET_SUBTYPE.ACCOUNT_REGISTRATION,
  })
  @IsEnum(TICKET_SUBTYPE)
  @IsNotEmpty()
  ticketSubtype: string;

  @ApiProperty({
    description: 'Priority of the ticket',
    enum: Priority,
    example: Priority.MEDIUM,
    default: Priority.MEDIUM,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority: string;

  @ApiProperty({
    description: 'Source of the ticket (web, email, phone, etc.)',
    example: 'web',
    default: 'web',
  })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({
    description: 'Files of the ticket',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  files?: FileDto[];

  @ApiProperty({
    description: 'Followers of the ticket',
    type: 'array',
    items: { type: 'string' },
  })
  @IsOptional()
  followers?: string[];

  @ApiProperty({
    description: 'Metadata of the ticket',
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  meta?: Record<string, any>;
}

export class FileDto {
  @ApiProperty({
    description: 'Path of the file',
    example:
      'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/03/30/cba1b4ef-6b1d-413f-86a9-192a93bc88ea/original/agadphiaanw-evu.png',
  })
  url: string;

  @ApiProperty({
    description: 'Type of the file',
    example: 'image',
  })
  type: string;
}
