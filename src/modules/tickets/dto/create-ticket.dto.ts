import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Priority, TicketType } from 'src/common/enums/ticket.enum';

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  customerId: string;

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
  @MinLength(3)
  @MaxLength(1000)
  message: string;

  @ApiProperty({
    description: 'Type of ticket',
    enum: TicketType,
    example: TicketType.SITE_ISSUE,
    default: TicketType.SITE_ISSUE,
  })
  @IsEnum(TicketType)
  @IsNotEmpty()
  ticketType: string;

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
