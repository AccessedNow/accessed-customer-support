import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Priority, TicketStatus, TicketType } from 'src/common/enums/ticket.enum';

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
    description: 'Filter by ticket type',
    enum: TicketType,
    required: false,
  })
  @IsEnum(TicketType)
  @IsOptional()
  ticketType?: string;

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
