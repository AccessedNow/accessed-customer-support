import { Controller, Query, Get, HttpStatus, Version, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';

@ApiTags('Activities Management')
@Controller('tickets/:ticketId/activities')
@ApiAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all activities with filtering and pagination',
    description:
      'Retrieves a list of activities for a specific ticket with optional sorting and filtering',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all activities matching the criteria',
    schema: {
      example: {
        data: {
          content: [
            {
              _id: '67ecaf9e1f6e7a52b210924b',
              deletedAt: null,
              type: 'Task Deleted',
              description: 'Task task 4 deleted',
              createdBy: {
                id: '67eca5b7ebc53b90827c3fd6',
                firstName: 'Đức',
                lastName: 'Châu',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              createdAt: '2025-04-02T03:31:42.941Z',
              updatedAt: '2025-04-02T03:31:42.941Z',
            },
            {
              _id: '67ecaf2c730e21071bf0a503',
              deletedAt: null,
              type: 'Task Updated',
              description: 'Task task 4 updated',
              createdBy: {
                id: '67eca5b7ebc53b90827c3fd6',
                firstName: 'Đức',
                lastName: 'Châu',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                changes: {
                  status: {
                    from: 'PENDING',
                    to: 'CLOSED',
                  },
                },
                priority: 'MEDIUM',
                ticketType: 'INCIDENT',
                assignee: '67eca5b7ebc53b90827c3fd6',
              },
              createdAt: '2025-04-02T03:29:48.205Z',
              updatedAt: '2025-04-02T03:29:48.205Z',
            },
            {
              _id: '67ecae60c552c66c6b7ea312',
              deletedAt: null,
              type: 'Task Created',
              description: 'Task task 4 created',
              createdBy: {
                id: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                ticketType: 'INCIDENT',
                assignee: {
                  id: '67eca5b7ebc53b90827c3fd6',
                  name: 'Đức Châu',
                  avatar: '',
                },
              },
              createdAt: '2025-04-02T03:26:24.084Z',
              updatedAt: '2025-04-02T03:26:24.084Z',
            },
            {
              _id: '67ecae59c552c66c6b7ea306',
              deletedAt: null,
              type: 'Task Created',
              description: 'Task task 3 created',
              createdBy: {
                id: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                ticketType: 'INCIDENT',
                assignee: {
                  id: '67eca5b7ebc53b90827c3fd6',
                  name: 'Đức Châu',
                  avatar: '',
                },
              },
              createdAt: '2025-04-02T03:26:17.323Z',
              updatedAt: '2025-04-02T03:26:17.323Z',
            },
            {
              _id: '67ecae53c552c66c6b7ea2fa',
              deletedAt: null,
              type: 'Task Created',
              description: 'Task task 2 created',
              createdBy: {
                id: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                ticketType: 'INCIDENT',
                assignee: {
                  id: '67eca5b7ebc53b90827c3fd6',
                  name: 'Đức Châu',
                  avatar: '',
                },
              },
              createdAt: '2025-04-02T03:26:11.185Z',
              updatedAt: '2025-04-02T03:26:11.185Z',
            },
            {
              _id: '67ecae4ec552c66c6b7ea2ee',
              deletedAt: null,
              type: 'Task Created',
              description: 'Task task 1 created',
              createdBy: {
                id: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                ticketType: 'INCIDENT',
                assignee: {
                  id: '67eca5b7ebc53b90827c3fd6',
                  name: 'Đức Châu',
                  avatar: '',
                },
              },
              createdAt: '2025-04-02T03:26:06.448Z',
              updatedAt: '2025-04-02T03:26:06.448Z',
            },
            {
              _id: '67eca4ceae95c4dcfd60ac78',
              deletedAt: null,
              type: 'Ticket Created',
              description: 'Ticket #IN-000005 created',
              createdBy: {
                id: '67ebca9e8c1373deda961688',
                name: 'Đức Châu',
              },
              ticket: '67eca4ceae95c4dcfd60ac75',
              metadata: {
                priority: 'HIGH',
                ticketType: 'INCIDENT',
              },
              createdAt: '2025-04-02T02:45:34.559Z',
              updatedAt: '2025-04-02T02:45:34.559Z',
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
          totalElements: 7,
          first: true,
          numberOfElements: 7,
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
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid customer token',
    schema: {
      example: {
        data: {
          code: 401,
          message: 'Bearer token is required',
        },
        code: 401,
        message: 'Success',
      },
    },
  })
  @Version('1')
  async findAll(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Query() query: QueryActivityDto,
  ) {
    return this.activitiesService.findAll({ ticketId, query });
  }
}
