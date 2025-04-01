import { Controller, Get, Param, Post, Body, Delete, Patch, Version } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { QueryNoteDto } from './dto/query-note.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { CreateNoteDto } from './dto/create-note.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateNoteDto } from './dto/update-note.dto';

@ApiTags('tickets/:ticketId/notes')
@Controller('tickets/:ticketId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notes for a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiBody({ type: QueryNoteDto })
  @ApiResponse({ status: 200, description: 'Return all notes for the ticket' })
  @Version('1')
  async findAll(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Body() query: QueryNoteDto,
  ) {
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
