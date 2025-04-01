import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Patch,
  Version,
  Delete,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketDto } from './dto/query-ticket.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ticket has been successfully created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid customer token' })
  @Version('1')
  createTicket(@Body() createTicketDto: CreateTicketDto, @User() user: any) {
    createTicketDto.customerId = user.id;
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets with filtering and pagination' })
  @ApiBody({ type: QueryTicketDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all tickets matching the criteria' })
  @Version('1')
  getTickets(@Body() queryTicketDto: QueryTicketDto) {
    return this.ticketsService.findAll(queryTicketDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the ticket' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ticket not found' })
  @Version('1')
  getTicket(@Param('id') id: string) {
    return this.ticketsService.findOneById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiBody({ type: UpdateTicketDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket has been successfully updated' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ticket not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid user token' })
  @Version('1')
  updateTicket(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
    @User() user: any,
  ) {
    const updateData = {
      ...updateTicketDto,
      userId: user.id,
    };

    return this.ticketsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Ticket has been successfully deleted' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ticket not found' })
  @Version('1')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.softDelete(id);
  }
}
