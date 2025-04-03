import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  Patch,
  Post,
  Version,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from 'src/common/decorators/user.decorator';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { PageSortDto } from 'src/common/utils/page-sort.dto';
import { ApiAuth } from 'src/common/decorators/swagger.decorator';

@ApiTags('Tasks Management')
@Controller('tickets/:ticketId/tasks')
@ApiAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('list')
  @ApiOperation({
    summary: 'Get all tasks for a ticket',
    description:
      'Retrieves a list of tasks for a specific ticket with optional filtering and pagination',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiQuery({ type: PageSortDto })
  @ApiBody({
    type: FilterTaskDto,
    description: 'Filter criteria',
    examples: {
      filters: {
        value: {
          status: 'OPEN',
          priority: 'HIGH',
          assignee: '67ebca9e8c1373deda961688',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all tasks for the ticket',
    schema: {
      example: {
        data: {
          content: [
            {
              _id: '67ecae60c552c66c6b7ea315',
              deletedAt: null,
              title: 'task 4',
              ticket: '67eca4ceae95c4dcfd60ac75',
              assignedTo: '67eca5b7ebc53b90827c3fd6',
              createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              status: 'PENDING',
              priority: 'MEDIUM',
              createdAt: '2025-04-02T03:26:24.152Z',
              updatedAt: '2025-04-02T03:26:24.152Z',
            },
            {
              _id: '67ecae59c552c66c6b7ea309',
              deletedAt: null,
              title: 'task 3',
              ticket: '67eca4ceae95c4dcfd60ac75',
              assignedTo: '67eca5b7ebc53b90827c3fd6',
              createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              status: 'PENDING',
              priority: 'MEDIUM',
              createdAt: '2025-04-02T03:26:17.391Z',
              updatedAt: '2025-04-02T03:26:17.391Z',
            },
            {
              _id: '67ecae53c552c66c6b7ea2fd',
              deletedAt: null,
              title: 'task 2',
              ticket: '67eca4ceae95c4dcfd60ac75',
              assignedTo: '67eca5b7ebc53b90827c3fd6',
              createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              status: 'PENDING',
              priority: 'MEDIUM',
              createdAt: '2025-04-02T03:26:11.252Z',
              updatedAt: '2025-04-02T03:26:11.252Z',
            },
            {
              _id: '67ecae4ec552c66c6b7ea2f1',
              deletedAt: null,
              title: 'task 1',
              ticket: '67eca4ceae95c4dcfd60ac75',
              assignedTo: '67eca5b7ebc53b90827c3fd6',
              createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
              status: 'PENDING',
              priority: 'MEDIUM',
              createdAt: '2025-04-02T03:26:06.539Z',
              updatedAt: '2025-04-02T03:26:06.539Z',
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
          totalElements: 4,
          first: true,
          numberOfElements: 4,
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
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad request',
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
  getTasks(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Query() pageSortDto: PageSortDto,
    @Body() filterTaskDto: FilterTaskDto,
  ) {
    const query = { ...pageSortDto, ...filterTaskDto };
    return this.tasksService.findAll({ ticketId, query });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a task by ID',
    description: 'Retrieves detailed information of a specific task by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    example: '67ebca9f8c1373deda96168d',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the task',
    schema: {
      example: {
        data: {
          _id: '67ebca9f8c1373deda96168d',
          title: 'Configure Email Server',
          description: 'Set up and configure email server for new account',
          status: 'IN_PROGRESS',
          priority: 'HIGH',
          assignee: {
            id: '67ebca9e8c1373deda961688',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
          },
          dueDate: '2025-04-02T11:14:39.070Z',
          ticket: '67ebca9f8c1373deda96168c',
          createdBy: '67ebca9e8c1373deda961688',
          createdAt: '2025-04-01T11:14:39.075Z',
          updatedAt: '2025-04-01T11:14:39.075Z',
        },
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Task not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  getTaskById(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
  ) {
    return this.tasksService.findOneById({ id, ticketId });
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new task',
    description: 'Creates a new task for a specific ticket',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: CreateTaskDto,
    description: 'Task creation data',
    examples: {
      task: {
        value: {
          title: 'Configure Email Server',
          description: 'Set up and configure email server for new account',
          status: 'PENDING',
          priority: 'HIGH',
          assignee: '67ebca9e8c1373deda961688',
          dueDate: '2025-04-02T11:14:39.070Z',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task has been successfully created',
    schema: {
      example: {
        data: {
          deletedAt: null,
          title: 'task 4',
          ticket: '67eca4ceae95c4dcfd60ac75',
          assignedTo: '67eca5b7ebc53b90827c3fd6',
          createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
          status: 'PENDING',
          priority: 'MEDIUM',
          _id: '67ecae60c552c66c6b7ea315',
          createdAt: '2025-04-02T03:26:24.152Z',
          updatedAt: '2025-04-02T03:26:24.152Z',
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
  createTask(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Body() createTaskDto: CreateTaskDto,
    @User() user: any,
  ) {
    const taskData = { ...createTaskDto, ticket: ticketId };
    return this.tasksService.createTask(taskData, user);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a task by ID',
    description: 'Updates an existing task with new information',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    example: '67ebca9f8c1373deda96168d',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiBody({
    type: UpdateTaskDto,
    description: 'Updated task information',
    examples: {
      task: {
        value: {
          status: 'COMPLETED',
          priority: 'HIGH',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the updated task',
    schema: {
      example: {
        data: {
          _id: '67ecae60c552c66c6b7ea315',
          deletedAt: null,
          title: 'task 4',
          ticket: '67eca4ceae95c4dcfd60ac75',
          assignedTo: '67eca5b7ebc53b90827c3fd6',
          createdBy: '4:6db934cb-9aba-4675-a007-eb0d31c51391:3634',
          status: 'CLOSED',
          priority: 'MEDIUM',
          createdAt: '2025-04-02T03:26:24.152Z',
          updatedAt: '2025-04-02T03:29:48.271Z',
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Task not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  updateTask(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @User() user: any,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.updateTask({
      id,
      ticketId,
      user,
      updateTaskDto,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a task by ID',
    description: 'Permanently deletes a task from the system',
  })
  @ApiParam({
    name: 'id',
    description: 'Task ID',
    example: '67ebca9f8c1373deda96168d',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'Ticket ID',
    example: '67ebca9f8c1373deda96168c',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return true if the task was deleted',
    schema: {
      example: {
        data: true,
        code: 200,
        message: 'Success',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Task not found',
    schema: {
      example: {
        data: {
          code: 404,
          message: 'Task not found',
        },
        code: 404,
        message: 'Success',
      },
    },
  })
  @Version('1')
  deleteTask(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @User() user: any,
  ) {
    return this.tasksService.permanentDelete({ id, ticketId, user });
  }
}
