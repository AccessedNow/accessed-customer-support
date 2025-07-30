import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { TicketStatus, TICKET_TYPE, Priority, TICKET_SUBTYPE } from 'src/common/enums/ticket.enum';
import { FileDto } from './create-ticket.dto';

export class UpdateTicketDto {
  @ApiProperty({
    description: 'Subject of the ticket',
    example: 'Defective Item Received',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  subject?: string;

  @ApiProperty({
    description: 'Message body of the ticket',
    example: 'I received a defective product and would like a replacement.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  message?: string;

  @ApiProperty({
    description:
      'Type of ticket. Use predefined enum values or set to "CUSTOM" to use customTicketType',
    enum: [...Object.values(TICKET_TYPE), 'CUSTOM'],
    example: TICKET_TYPE.ACCOUNT,
    required: false,
  })
  @IsOptional()
  @IsString()
  ticketType?: string;

  @ApiProperty({
    description: 'Custom ticket type when ticketType is "CUSTOM"',
    example: 'CUSTOM_SUPPORT',
    required: false,
  })
  @ValidateIf((o) => o.ticketType === 'CUSTOM')
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  customTicketType?: string;

  @ApiProperty({
    description:
      'Subtype of ticket. Use predefined enum values or set to "CUSTOM" to use customTicketSubtype',
    enum: [...Object.values(TICKET_SUBTYPE), 'CUSTOM'],
    example: TICKET_SUBTYPE.ACCOUNT_REGISTRATION,
    required: false,
  })
  @IsOptional()
  @IsString()
  ticketSubtype?: string;

  @ApiProperty({
    description: 'Custom ticket subtype when ticketSubtype is "CUSTOM"',
    example: 'ALLOW_USER_ENTER_NEW_VALUE',
    required: false,
  })
  @ValidateIf((o) => o.ticketSubtype === 'CUSTOM')
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  customTicketSubtype?: string;

  @ApiProperty({
    description: 'Status of the ticket',
    enum: TicketStatus,
    example: TicketStatus.IN_PROGRESS,
    required: false,
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Priority of the ticket',
    enum: Priority,
    example: Priority.MEDIUM,
    required: false,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: string;

  @ApiProperty({
    description: 'Assignee ID',
    example: '66f000000000000000000000',
    required: false,
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiProperty({
    description: 'Files to add to the ticket',
    type: 'array',
    items: { type: 'object', properties: { url: { type: 'string' }, type: { type: 'string' } } },
    required: false,
  })
  @IsOptional()
  files?: FileDto[];
}

