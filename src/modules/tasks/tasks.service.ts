import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Task } from './schemas/task.schema';
import { TasksRepositoryInterface } from 'src/core/repositories/interfaces/tasks.interface';
import { FindAllResponse } from 'src/common/types/common.type';
import { FilterMap, QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { Types } from 'mongoose';
import { TicketsService } from '../tickets/tickets.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from '../activities/activities.service';
import { Activity, ActivityLogType, ActivityType } from '../activities/schemas/activity.schema';
import { TaskStatus } from 'src/common/enums/task.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService extends BaseServiceAbstract<Task> {
  protected readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject('TasksRepositoryInterface')
    protected readonly tasksRepository: TasksRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    private readonly ticketsService: TicketsService,
    private readonly activitiesService: ActivitiesService,
    private readonly usersService: UsersService,
  ) {
    super(tasksRepository, httpService, configService, new Logger(TasksService.name));
  }

  async findAll({
    ticketId,
    query,
  }: {
    ticketId: string;
    query: any;
  }): Promise<FindAllResponse<Task>> {
    const filterMap: FilterMap = {
      title: 'title',
      status: 'status',
      priority: 'priority',
    };

    const conditions = QueryBuilderUtil.buildFilterConditions(query, filterMap);
    const options = QueryBuilderUtil.buildQueryOptions(query);

    return await this.tasksRepository.findAll({ ...conditions, ticket: ticketId }, options);
  }

  async findOneById({ id, ticketId }: { id: string; ticketId: string }): Promise<Task> {
    const task = await this.tasksRepository.findOneByCondition({
      _id: id,
      ticket: ticketId,
    });
    if (!task) throw new NotFoundException('Task not found');

    return task;
  }

  async createTask(
    createTaskDto: CreateTaskDto,
    user: any,
  ): Promise<{ newTask: Task; activity: Activity }> {
    const ticket = await this.ticketsService.findOneById(createTaskDto.ticket);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const assignee = await this.usersService.findUserFromPartyService(
      createTaskDto.assignedTo || user?.id,
    );

    const taskData = {
      ...createTaskDto,
      ticket: ticket._id,
      assignedTo: assignee?._id,
      assignee: assignee
        ? {
            id: assignee._id,
            partyId: assignee.partyId,
            name: assignee.name,
            avatar: assignee.avatar,
          }
        : null,
      createdBy: user.id,
    };

    const activity = await this.activitiesService.create({
      type: ActivityType.TASK_CREATED,
      description: `Task ${taskData.title} created`,
      createdBy: {
        id: user.id,
        name: user.name,
      },
      ticket: ticket._id,
      metadata: {
        priority: taskData.priority,
        ticketType: ticket.ticketType,
        assignee: {
          id: assignee._id,
          name: assignee.name,
          logType: ActivityLogType.TASK_CREATED,
          avatar: assignee.avatar,
        },
      },
    });

    const newTask = await this.tasksRepository.create(taskData);
    return { newTask, activity };
  }

  async updateTask({
    id,
    updateTaskDto,
    user,
    ticketId,
  }: {
    id: string;
    updateTaskDto: UpdateTaskDto;
    user: any;
    ticketId?: string;
  }): Promise<{ taskUpdated: Task; activity: Activity }> {
    const ticket = await this.ticketsService.findOneById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const task = await this.tasksRepository.findOneByCondition({
      _id: id,
      ticket: ticket._id,
    });
    if (!task) throw new NotFoundException('Task not found');

    const completedByUser = await this.usersService.findOneByCondition({
      partyId: user.id,
    });

    const changes: Record<string, { from: any; to: any }> = {};
    const updateData: Record<string, any> = {};

    // Handle status changes
    if (updateTaskDto.status && updateTaskDto.status !== task.status) {
      changes['status'] = { from: task.status, to: updateTaskDto.status };
      updateData['status'] = updateTaskDto.status;

      if (updateTaskDto.status === TaskStatus.COMPLETED) {
        if (task.status === TaskStatus.COMPLETED) {
          throw new BadRequestException('Task already completed');
        }
        updateData.completedAt = new Date();
        updateData.metadata = {
          ...(task.metadata || {}),
          completedBy: completedByUser.id,
          completedAt: new Date(),
        };
      } else if (
        updateTaskDto.status === TaskStatus.PENDING &&
        task.status === TaskStatus.COMPLETED
      ) {
        updateData.completedAt = null;
        if (task.metadata) {
          updateData.metadata = { ...task.metadata };
          delete updateData.metadata.completedBy;
          delete updateData.metadata.completedAt;
        }
      }
    }

    // Handle priority changes
    if (updateTaskDto.priority && updateTaskDto.priority !== task.priority) {
      changes['priority'] = { from: task.priority, to: updateTaskDto.priority };
      updateData['priority'] = updateTaskDto.priority;
    }

    // Handle due date changes
    if (updateTaskDto.dueDate && updateTaskDto.dueDate.toString() !== task.dueDate?.toString()) {
      changes['dueDate'] = { from: task.dueDate, to: updateTaskDto.dueDate };
      updateData['dueDate'] =
        typeof updateTaskDto.dueDate === 'string'
          ? new Date(updateTaskDto.dueDate)
          : updateTaskDto.dueDate;
    }

    // Handle assignee changes with proper type handling
    if (updateTaskDto.assignedTo === null || updateTaskDto.assignedTo === 'null') {
      changes['assignedTo'] = {
        from: task.assignedTo,
        to: null,
      };
      updateData['assignedTo'] = null;
    } else if (
      updateTaskDto.assignedTo &&
      updateTaskDto.assignedTo !== task.assignedTo?.toString()
    ) {
      const user = await this.usersService.findUserFromPartyService(updateTaskDto.assignedTo);
      if (!user) throw new NotFoundException('User not found');

      changes['assignedTo'] = {
        from: task.assignedTo,
        to: user._id,
      };
      updateData['assignee'] = {
        id: user._id?.toString(),
        party: user.partyId,
        name: user.name,
        avatar: user.avatar,
      };
      updateData['assignedTo'] = new Types.ObjectId(user._id.toString());
    }

    // If no changes, return the existing task
    if (Object.keys(changes).length === 0) {
      return { taskUpdated: task, activity: null };
    }

    const activity = await this.activitiesService.create({
      type: ActivityType.TASK_UPDATED,
      description: `Task ${task.title} updated`,
      createdBy: {
        id: completedByUser.id || user.id,
        firstName: completedByUser.firstName || user.firstName,
        lastName: completedByUser.lastName || user.lastName,
      },
      ticket: ticket._id,
      metadata: {
        changes,
        logType: ActivityLogType.TASK_UPDATED,
        priority: task.priority,
        ticketType: ticket.ticketType,
        assignee: task.assignedTo,
      },
    });

    const taskUpdated = await this.tasksRepository.update(id, updateData);
    return { taskUpdated, activity };
  }

  async softDelete({ id, ticketId, user }: { id: string; ticketId: string; user: any }) {
    const task = await this.tasksRepository.findOneByCondition({
      _id: id,
      ticket: ticketId,
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status === TaskStatus.COMPLETED)
      throw new BadRequestException('Cannot delete completed task');

    const createdByUser = await this.usersService.findOneByCondition({
      partyId: user.id,
    });
    const activity = await this.activitiesService.create({
      type: ActivityType.TASK_DELETED,
      logType: ActivityLogType.TASK_DELETED,
      description: `Task ${task.title} deleted`,
      createdBy: {
        id: createdByUser.id || user.id,
        firstName: createdByUser.firstName || user.firstName,
        lastName: createdByUser.lastName || user.lastName,
      },
      ticket: ticketId,
    });

    const taskDeleted = await this.tasksRepository.softDelete(id);
    return { taskDeleted, activity };
  }
}
