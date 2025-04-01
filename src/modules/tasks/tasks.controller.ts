import { Controller, Get, Param, Delete, Body, Patch, Post, Version } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { User } from 'src/common/decorators/user.decorator';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';

@ApiTags('tickets/:ticketId/tasks')
@Controller('tickets/:ticketId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks for a ticket' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiBody({ type: QueryTaskDto })
  @ApiResponse({ status: 200, description: 'Return all tasks for the ticket' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @Version('1')
  getTasks(
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @Body() queryTaskDto: QueryTaskDto,
  ) {
    return this.tasksService.findAll({ ticketId, queryTaskDto });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Return the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Version('1')
  getTaskById(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
  ) {
    return this.tasksService.findOneById({ id, ticketId });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, description: 'Task has been successfully created' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
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
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiBody({ type: UpdateTaskDto })
  @ApiResponse({ status: 200, description: 'Return the updated task' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Task not found' })
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
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiParam({ name: 'id', description: 'Task ID' })
  @ApiParam({ name: 'ticketId', description: 'Ticket ID' })
  @ApiResponse({ status: 200, description: 'Return true if the task was deleted' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @Version('1')
  deleteTask(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('ticketId', ParseMongoIdPipe) ticketId: string,
    @User() user: any,
  ) {
    return this.tasksService.permanentDelete({ id, ticketId, user });
  }
}
