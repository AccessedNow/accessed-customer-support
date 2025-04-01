import { Controller, Get, Param, Post, Body, Delete, Patch, Version, Query } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { FilterNoteDto } from './dto/filter-note.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { CreateNoteDto } from './dto/create-note.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PageSortDto } from 'src/common/utils/page-sort.dto';

@ApiTags('tickets/:ticketId/notes')
@Controller('tickets/:ticketId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notes for a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiBody({ type: FilterNoteDto })
  @ApiQuery({ type: PageSortDto })
  @ApiResponse({ status: 200, description: 'Return all notes for the ticket' })
  @Version('1')
  async findAll(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Query() pageSortDto: PageSortDto,
    @Body() filterNoteDto: FilterNoteDto,
  ) {
    const query = { ...pageSortDto, ...filterNoteDto };
    return this.notesService.findAll({ ticketId, query });
  }

  @Get(':id')
  @Version('1')
  async findOne(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string,
  ) {
    return this.notesService.findOneByTicketAndId({ ticketId, id });
  }

  @Post()
  @Version('1')
  async create(
    @Param('ticketId') ticketId: string,
    @Body() createNoteDto: CreateNoteDto,
    @User() user: any,
  ) {
    return this.notesService.create({ ticketId, createNoteDto, user });
  }

  @Patch(':id')
  @Version('1')
  async update(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @User() user: any,
  ) {
    return this.notesService.updateNote({ ticketId, id, updateNoteDto, user });
  }

  @Delete(':id')
  @Version('1')
  async delete(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @User() user: any,
  ) {
    return this.notesService.delete({ ticketId, id, user });
  }
}
