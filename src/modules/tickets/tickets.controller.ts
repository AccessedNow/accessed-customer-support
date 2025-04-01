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
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { PageSortDto } from 'src/common/utils/page-sort.dto';
import { FilterTicketDto } from './dto/filter-ticket.dto';
import { RequirePrivileges } from 'src/common/decorators/require-privileges.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('tickets')
@Controller('tickets')
@Roles('ROLE_CUSTOMER_SUPPORT', 'ROLE_CUSTOMER_SUPPORT_ADMIN')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Ticket has been successfully created' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid customer token' })
  @RequirePrivileges('ADD_TICKETS')
  @Version('1')
  createTicket(@Body() createTicketDto: CreateTicketDto, @User() user: any) {
    createTicketDto.customerId = user.id;
    return this.ticketsService.create(createTicketDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tickets with filtering and pagination' })
  @ApiQuery({ type: PageSortDto })
  @ApiBody({ type: FilterTicketDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all tickets matching the criteria' })
  @RequirePrivileges('VIEW_TICKETS')
  @Version('1')
  getTickets(@Body() filterTicketDto: FilterTicketDto, @Query() pageSortDto: PageSortDto) {
    const query = { ...filterTicketDto, ...pageSortDto };
    return this.ticketsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the ticket' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Ticket not found' })
  @RequirePrivileges('VIEW_TICKETS')
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
  @RequirePrivileges('UPDATE_TICKETS')
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
  @RequirePrivileges('DELETE_TICKETS')
  @Version('1')
  deleteTicket(@Param('id') id: string) {
    return this.ticketsService.softDelete(id);
  }
}
