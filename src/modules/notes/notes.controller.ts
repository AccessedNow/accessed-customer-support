import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Delete,
  Patch,
  Version,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { NotesService } from './notes.service';
import { FilterNoteDto } from './dto/filter-note.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { CreateNoteDto } from './dto/create-note.dto';
import { User } from 'src/common/decorators/user.decorator';
import { UpdateNoteDto } from './dto/update-note.dto';
import { PageSortDto } from 'src/common/utils/page-sort.dto';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';

@ApiTags('Notes Management')
@Controller('tickets/:ticketId/notes')
@ApiAuth()
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post('list')
  @ApiOperation({
    summary: 'Get all notes for a ticket',
    description:
      'Retrieves a list of notes for a specific ticket with optional filtering and pagination',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: FilterNoteDto,
    description: 'Filter criteria',
    required: false,
    examples: {
      filters: {
        value: {
          type: 'INTERNAL',
          isPrivate: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all notes for the ticket',
    schema: {
      example: {
        data: {
          content: [
            {
              _id: '67ecb076df2f5bd7199d5714',
              deletedAt: null,
              content: 'note content 1',
              ticket: '67eca4ceae95c4dcfd60ac75',
              createdBy: {
                id: '67eca5b7ebc53b90827c3fd6',
                name: 'Đức Châu',
                avatar: '',
              },
              isPrivate: false,
              createdAt: '2025-04-02T03:35:18.391Z',
              updatedAt: '2025-04-02T03:35:18.391Z',
              files: [
                {
                  _id: '67ecb076df2f5bd7199d571a',
                  fileId: '60790d68-1645-4589-8674-199160ede83f',
                  fileType: 'image',
                  path: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/large/screenshot-2025-03-23-at-9.webp',
                  note: '67ecb076df2f5bd7199d5714',
                },
              ],
            },
          ],
          pageable: {
            sort: {
              unsorted: false,
              sort: true,
              empty: false,
            },
            pageSize: 10,
            pageNumber: 1,
            offset: 0,
            paged: true,
            unpaged: false,
          },
          last: true,
          totalPages: 1,
          totalElements: 1,
          first: true,
          numberOfElements: 1,
          size: 10,
          number: 1,
          empty: false,
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Ticket not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Query() pageSortDto: PageSortDto,
    @Body() filterNoteDto: FilterNoteDto
  ) {
    const query = { ...pageSortDto, ...filterNoteDto };
    return this.notesService.findAll({ ticketId, query });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a note by ID',
    description: 'Retrieves detailed information of a specific note by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Note ID',
    example: '67ebca9f8c1373deda96169a',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the note',
    schema: {
      example: {
        data: {
          _id: '67ecb076df2f5bd7199d5714',
          deletedAt: null,
          content: 'note content 1',
          ticket: '67eca4ceae95c4dcfd60ac75',
          createdBy: {
            id: '67eca5b7ebc53b90827c3fd6',
            name: 'Đức Châu',
            avatar: '',
          },
          isPrivate: false,
          createdAt: '2025-04-02T03:35:18.391Z',
          updatedAt: '2025-04-02T03:35:18.391Z',
          files: [
            {
              _id: '67ecb076df2f5bd7199d571a',
              fileId: '60790d68-1645-4589-8674-199160ede83f',
              fileType: 'image',
              filename: 'screenshot-2025-03-23-at-9.webp',
              path: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/large/screenshot-2025-03-23-at-9.webp',
              note: '67ecb076df2f5bd7199d5714',
            },
          ],
          id: '67ecb076df2f5bd7199d5714',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Note not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Note not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async findOne(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string
  ) {
    return this.notesService.findOneByTicketAndId({ ticketId, id });
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new note',
    description: 'Creates a new note for a specific ticket',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: CreateNoteDto,
    description: 'Note creation data',
    examples: {
      note: {
        value: {
          content: 'Internal note: Customer reported similar issues before',
          isPrivate: false,
          files: [
            {
              url: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/03/acf32ca2-5ed9-4f66-9641-82a39743eff2/original/agadlriaaszpcfu.png',
              type: 'image',
            },
            {
              url: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/03/1eb08956-490e-449b-8c5d-52cc776fda4f/original/agadjbiaagbhefu.png',
              type: 'image',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note has been successfully created',
    schema: {
      example: {
        data: {
          deletedAt: null,
          content: 'note content 1',
          ticket: '67eca4ceae95c4dcfd60ac75',
          createdBy: {
            id: '67eca5b7ebc53b90827c3fd6',
            name: 'Đức Châu',
            avatar: '',
          },
          isPrivate: false,
          _id: '67ecb076df2f5bd7199d5714',
          createdAt: '2025-04-02T03:35:18.391Z',
          updatedAt: '2025-04-02T03:35:18.391Z',
          files: [
            {
              url: 'https://customer-support-bucket-s3.s3.ap-southeast-1.amazonaws.com/customer-support/2025/04/02/60790d68-1645-4589-8674-199160ede83f/large/screenshot-2025-03-23-at-9.webp',
              type: 'image',
            },
          ],
          id: '67ecb076df2f5bd7199d5714',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request - Invalid data',
    schema: {
      example: {
        data: {
          code: 400,
          message: 'Validation failed',
        },
        code: 400,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async create(
    @Param('ticketId') ticketId: string,
    @Body() createNoteDto: CreateNoteDto,
    @User() user: any
  ) {
    return this.notesService.create({ ticketId, createNoteDto, user });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a note by ID',
    description: 'Updates an existing note with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Note ID',
    example: '67ebca9f8c1373deda96169a',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: UpdateNoteDto,
    description: 'Updated note information',
    examples: {
      note: {
        value: {
          content: 'Updated: Customer reported similar issues before',
          isPrivate: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the updated note',
    schema: {
      example: {
        data: {
          _id: '67ecb076df2f5bd7199d5714',
          deletedAt: null,
          content: 'test create note content 1 updated',
          ticket: '67eca4ceae95c4dcfd60ac75',
          createdBy: {
            id: '67eca5b7ebc53b90827c3fd6',
            name: 'Đức Châu',
            avatar: '',
          },
          isPrivate: false,
          createdAt: '2025-04-02T03:35:18.391Z',
          updatedAt: '2025-04-02T03:37:55.329Z',
          updatedBy: {
            id: '67eca5b7ebc53b90827c3fd6',
            name: 'Đức Châu',
            avatar: '',
          },
          id: '67ecb076df2f5bd7199d5714',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Note not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Note not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async update(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() updateNoteDto: UpdateNoteDto,
    @User() user: any
  ) {
    return this.notesService.updateNote({ ticketId, id, updateNoteDto, user });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a note by ID',
    description: 'Permanently deletes a note from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Note ID',
    example: '67ebca9f8c1373deda96169a',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return true if the note was deleted',
    schema: {
      example: {
        data: {
          success: true,
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Note not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Note not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async delete(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Param('id', ParseMongoIdPipe) id: string,
    @User() user: any
  ) {
    return this.notesService.delete({ ticketId, id, user });
  }
}
