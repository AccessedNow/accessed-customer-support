import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Priority, TicketStatus, TICKET_TYPE, TICKET_SUBTYPE } from 'src/common/enums/ticket.enum';

export class FilterTicketDto {
  @ApiProperty({
    description: 'Filter by ticket status',
    enum: TicketStatus,
    required: false,
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: string;

  @ApiProperty({
    description: 'Filter by ticket type. Can use predefined enum values or custom values',
    enum: [...Object.values(TICKET_TYPE), 'CUSTOM'],
    required: false,
  })
  @IsOptional()
  @IsString()
  ticketType?: string;

  @ApiProperty({
    description: 'Filter by ticket subtype. Can use predefined enum values or custom values',
    enum: [...Object.values(TICKET_SUBTYPE), 'CUSTOM'],
    required: false,
  })
  @IsOptional()
  @IsString()
  ticketSubtype?: string;

  @ApiProperty({
    description: 'Filter by custom ticket type',
    example: 'CUSTOM_SUPPORT',
    required: false,
  })
  @IsOptional()
  @IsString()
  customTicketType?: string;

  @ApiProperty({
    description: 'Filter by custom ticket subtype',
    example: 'ALLOW_USER_ENTER_NEW_VALUE',
    required: false,
  })
  @IsOptional()
  @IsString()
  customTicketSubtype?: string;

  @ApiProperty({
    description: 'Filter by priority',
    enum: Priority,
    required: false,
  })
  @IsEnum(Priority)
  @IsOptional()
  priority?: string;

  @ApiProperty({
    description: 'Filter by assigned agent ID',
    example: 'AGENT-456',
    required: false,
  })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({
    description: 'Filter by customer ID',
    example: 'CUST-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  customerId?: string;
}

