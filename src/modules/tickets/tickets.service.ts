import { Inject, Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Ticket } from './schemas/ticket.schema';
import { TicketsRepositoryInterface } from 'src/core/repositories/interfaces/tickets.interface';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FindAllResponse } from 'src/common/types/common.type';
import { ActivitiesService } from '../activities/activities.service';
import { TicketStatus, Priority, TICKET_TYPE_PREFIX_MAP } from 'src/common/enums/ticket.enum';
import { TICKET_TYPE_PRIORITY_MAP } from 'src/common/constants/ticket-type-priority-map';
import { ActivityLogType, ActivityType } from '../activities/schemas/activity.schema';
import { SLA_CONFIG } from 'src/common/constants/sla-config';
import { CustomersService } from '../customers/customers.service';
import { FilterMap, QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TicketCounterRepository } from 'src/core/repositories/ticket-counter.repository';
import { FilesService } from '../files/files.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/schemas/user.schema';

@Injectable()
export class TicketsService extends BaseServiceAbstract<Ticket> {
  protected readonly logger = new Logger(TicketsService.name);

  constructor(
    @Inject('TicketsRepositoryInterface')
    protected readonly ticketsRepository: TicketsRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    private readonly activitiesService: ActivitiesService,
    private readonly customersService: CustomersService,
    private readonly ticketCounterRepository: TicketCounterRepository,
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {
    super(ticketsRepository, httpService, configService, new Logger(TicketsService.name));
  }

  async create(createTicketDto: CreateTicketDto) {
    const customer = await this.usersService.findUserFromPartyService(createTicketDto.customerId);
    const prefix = TICKET_TYPE_PREFIX_MAP[createTicketDto.ticketType] || 'OT';
    const sequence = await this.ticketCounterRepository.getNextSequence(prefix);
    const ticketId = `#${prefix}-${sequence.toString().padStart(6, '0')}`;
    const priority =
      createTicketDto.priority ||
      TICKET_TYPE_PRIORITY_MAP[createTicketDto.ticketType] ||
      Priority.LOW;
    const sla = SLA_CONFIG[priority];
    const firstResponseDue = new Date(new Date().getTime() + sla.firstResponse * 60 * 60 * 1000);
    const resolutionDue = new Date(new Date().getTime() + sla.resolution * 60 * 60 * 1000);

    // Handle assignee and followers
    const [assignee, followers] = await Promise.all([
      this.handleAssignee(createTicketDto.assigneeId),
      this.handleFollowers(createTicketDto.followers),
    ]);

    const ticketData = {
      ...createTicketDto,
      ticketId,
      customer: {
        id: customer._id,
        customerId: customer.partyId,
        name: customer.name,
        avatar: customer.avatar,
      },
      createdBy: customer._id || null,
      status: TicketStatus.OPEN,
      priority,
      firstResponseDue,
      resolutionDue,
      assignee: assignee
        ? {
            id: assignee._id,
            partyId: assignee.partyId,
            name: assignee.name,
            avatar: assignee.avatar,
          }
        : {},
      followers: followers.map((follower) => follower._id),
    };

    const ticket = await this.ticketsRepository.create(ticketData);
    await this.activitiesService.create({
      type: ActivityType.TICKET_CREATED,
      description: `Ticket ${ticketId} created`,
      createdBy: {
        id: customer._id,
        name: customer.name,
      },
      ticket: ticket._id,
      metadata: {
        priority,
        logType: ActivityLogType.TICKET_CREATED,
        ticketType: createTicketDto.ticketType,
        assignee: assignee
          ? {
              id: assignee._id,
              partyId: assignee.partyId,
              name: assignee.name,
              avatar: assignee.avatar,
            }
          : null,
      },
    });

    if (createTicketDto.files && createTicketDto.files.length > 0) {
      await Promise.all(
        createTicketDto.files.map((file) =>
          this.filesService.create({ file, ticketId: ticket._id.toString() }),
        ),
      );
    }

    return ticket;
  }

  private async handleAssignee(assigneeId?: string): Promise<User | null> {
    if (!assigneeId) {
      return null;
    }

    try {
      const assignee = await this.usersService.findUserFromPartyService(assigneeId);
      if (!assignee) {
        throw new NotFoundException(`Assignee with ID ${assigneeId} not found`);
      }
      return assignee;
    } catch (error) {
      this.logger.error(`Error finding assignee: ${error.message}`);
      throw new BadRequestException(`Invalid assignee ID: ${assigneeId}`);
    }
  }

  private async handleFollowers(followerIds?: string[]): Promise<User[]> {
    if (!followerIds || followerIds.length === 0) {
      return [];
    }

    const followers = [];
    for (const id of followerIds) {
      const follower = await this.usersService.findUserFromPartyService(id);
      if (follower) {
        followers.push(follower);
      }
    }

    if (followers.length !== followerIds.length) {
      this.logger.warn('Some followers could not be found');
    }

    return followers;
  }

  async findAll(query: any): Promise<FindAllResponse<Ticket>> {
    const filterMap: FilterMap = {
      status: 'status',
      ticketType: 'ticketType',
      priority: 'priority',
      assignedTo: 'assignee.id',
      customerId: 'customer.customerId',
    };

    const conditions = QueryBuilderUtil.buildFilterConditions(query, filterMap);
    const options = QueryBuilderUtil.buildQueryOptions(query);

    return await this.ticketsRepository.findAll(conditions, options);
  }

  async findOneById(id: string) {
    const populateOptions = {
      populate: [
        {
          path: 'activities',
          select: 'type description createdAt createdBy metadata deletedAt',
          options: { sort: { createdAt: -1 }, limit: 4, match: { deletedAt: null } },
        },
        {
          path: 'tasks',
          select: 'title status priority dueDate deletedAt',
          options: { sort: { createdAt: -1 }, limit: 4, match: { deletedAt: null } },
        },
        {
          path: 'notes',
          select: 'content createdAt createdBy files deletedAt',
          options: { sort: { createdAt: -1 }, limit: 4, match: { deletedAt: null } },
          populate: {
            path: 'files',
            select: 'fileId fileType path createdAt deletedAt',
            options: { sort: { createdAt: -1 }, limit: 4, match: { deletedAt: null } },
          },
        },
        {
          path: 'files',
          select: 'fileId path fileType deletedAt',
          options: { sort: { createdAt: -1 }, limit: 4, match: { note: null, deletedAt: null } },
        },
      ],
    };

    const ticket = await this.ticketsRepository.findOneById(id, null, populateOptions);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const plainTicket = this.transformTicketResponse(ticket);
    const collections = ['activities', 'tasks', 'notes', 'files'];
    const displayLimit = 3;

    collections.forEach((collection) => {
      if (plainTicket[collection] && Array.isArray(plainTicket[collection])) {
        const totalFetched = plainTicket[collection].length;
        const hasMore = totalFetched > displayLimit;

        // Only return the display limit
        plainTicket[collection] = {
          data: plainTicket[collection].slice(0, displayLimit),
          hasMore: hasMore,
        };
      }
    });

    return plainTicket;
  }

  async update(id: string, updateTicketDto: Partial<Ticket>): Promise<Ticket> {
    const userId = (updateTicketDto as any).userId;
    const createdBy = await this.usersService.findUserFromPartyService(userId);

    const ticket = await this.ticketsRepository.findOneById(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const changes: Record<string, { from: any; to: any }> = {};
    const updateData: Record<string, any> = {};
    let activity = null;

    const basicFields = ['subject', 'message', 'ticketType'];
    for (const field of basicFields) {
      if (updateTicketDto[field] !== undefined && updateTicketDto[field] !== ticket[field]) {
        changes[field] = { from: ticket[field], to: updateTicketDto[field] };
        updateData[field] = updateTicketDto[field];
      }
    }

    if (updateTicketDto.status && updateTicketDto.status !== ticket.status) {
      if (!this.isValidStatusTransition(ticket.status, updateTicketDto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${ticket.status} to ${updateTicketDto.status}`,
        );
      }
      changes['status'] = { from: ticket.status, to: updateTicketDto.status };
      updateData['status'] = updateTicketDto.status;
    }

    if (updateTicketDto.priority && updateTicketDto.priority !== ticket.priority) {
      changes['priority'] = {
        from: ticket.priority,
        to: updateTicketDto.priority,
      };
      updateData['priority'] = updateTicketDto.priority;
    }

    const assigneeId = (updateTicketDto as any).assigneeId;
    if (
      assigneeId &&
      (!ticket?.assignee?.assigneeId || assigneeId !== ticket.assignee?.assigneeId)
    ) {
      const assignee = await this.handleAssignee(assigneeId);
      changes['assigneeId'] = {
        from: ticket?.assignee?.assigneeId,
        to: assigneeId,
      };

      updateData['assigneeId'] = assigneeId;
      updateData['assignee'] = {
        id: assignee._id?.toString(),
        partyId: assignee.partyId,
        name: assignee.name,
        avatar: assignee.avatar,
      };
    }

    const files = (updateTicketDto as any).files;
    if (files && files.length > 0) {
      await Promise.all(
        files.map((file) => this.filesService.create({ file, ticketId: ticket._id.toString() })),
      );

      // Add files to the changes collection
      changes['files'] = {
        from: [],
        to: files.map((file) => file.originalname || file.name),
      };
    }

    if ((updateTicketDto as any).userId && Object.keys(changes).length > 0) {
      activity = await this.createUpdateActivity(ticket._id.toString(), changes, createdBy);
    }

    if (Object.keys(changes).length === 0) {
      return ticket;
    }
    const updatedTicket = await this.ticketsRepository.update(id, updateData);

    // Convert Mongoose document to plain object and return only necessary data
    const plainTicket = this.transformTicketResponse(updatedTicket);

    // Add activity to the response without changing the return type
    (plainTicket as any).activity = activity;

    return plainTicket as Ticket;
  }

  /**
   * Transform Mongoose document to plain object
   */
  private transformTicketResponse(ticket: any): Record<string, any> {
    // If it's a Mongoose document with toJSON method
    if (ticket && typeof ticket.toJSON === 'function') {
      return ticket.toJSON();
    }

    // If it already has _doc property (Mongoose internal)
    if (ticket && ticket._doc) {
      return { ...ticket._doc };
    }

    // Otherwise return as is
    return ticket;
  }

  async softDelete(id: string) {
    const ticket = await this.ticketsRepository.softDelete(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return {
      success: true,
      message: `Ticket ${id} has been deleted`,
    };
  }

  private async createFileAddedActivity(ticketId: string, fileCount: number, createdBy: User) {
    return await this.activitiesService.create({
      type: ActivityType.ATTACHMENT_ADDED,
      description: `${fileCount} file(s) added to the ticket`,
      ticket: ticketId,
      createdBy: {
        id: createdBy._id.toString(),
        name: createdBy.name,
      },
      metadata: {
        filesAdded: fileCount,
        logType: ActivityLogType.ATTACHMENT_ADDED,
      },
    });
  }

  private async createUpdateActivity(
    ticketId: string,
    changes: Record<string, { from: any; to: any }>,
    createdBy: User,
  ) {
    let activityType = ActivityType.TICKET_UPDATED;
    let activityLogType = ActivityLogType.TICKET_UPDATED;
    let description = 'Ticket updated';

    if (changes.status) {
      activityType = ActivityType.STATUS_CHANGED;
      activityLogType = ActivityLogType.STATUS_CHANGED;
      description = `Status changed from ${changes.status.from} to ${changes.status.to}`;
    } else if (changes.priority) {
      activityLogType = ActivityLogType.PRIORITY_CHANGED;
      activityType = ActivityType.PRIORITY_CHANGED;
      description = `Priority changed from ${changes.priority.from} to ${changes.priority.to}`;
    } else if (changes.assignee) {
      activityLogType = ActivityLogType.ASSIGNED;
      activityType = ActivityType.ASSIGNED;
      description = `Ticket assigned to new agent`;
    }

    // Create the activity entry
    return await this.activitiesService.create({
      type: activityType,
      description,
      ticket: ticketId,
      createdBy: {
        id: createdBy._id.toString(),
        name: createdBy.name,
      },
      metadata: {
        changes,
        logType: activityLogType,
      },
    });
  }

  private isValidStatusTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.PENDING, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [
        TicketStatus.PENDING,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.PENDING]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
      [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
      [TicketStatus.REOPENED]: [
        TicketStatus.IN_PROGRESS,
        TicketStatus.PENDING,
        TicketStatus.RESOLVED,
        TicketStatus.CLOSED,
      ],
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  async getFollowers(id: string) {
    const ticket = await this.ticketsRepository.findOneById(id, null, {
      populate: {
        path: 'followers',
        select: 'partyId name email avatar',
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket.followers;
  }

  async addFollower(ticketId: string, partyId: string, userId: string) {
    const createdBy = await this.usersService.findOneByCondition({
      partyId: userId,
    });
    const ticket = await this.ticketsRepository.findOneById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const follower = await this.usersService.findOneByCondition({
      partyId,
    });
    if (!follower) {
      const user = await this.usersService.findUserFromPartyService(partyId);
      if (!user) {
        throw new NotFoundException(`Follower with ID ${user} not found`);
      }
    }

    // Check if user is already a follower
    if (ticket.followers.some((followerId) => followerId.toString() === follower._id.toString())) {
      throw new BadRequestException(`Follower ${partyId} is already following the ticket`);
    }

    // Add follower
    await this.ticketsRepository.update(ticketId, {
      followers: [...ticket.followers, follower._id as any],
    });

    // Create activity
    await this.activitiesService.create({
      type: ActivityType.TICKET_UPDATED,
      description: `User ${follower.name} started following the ticket`,
      ticket: ticketId,
      createdBy: {
        id: createdBy._id,
        name: createdBy.name,
      },
      metadata: {
        logType: ActivityLogType.TICKET_UPDATED,
        changes: {
          followers: {
            from: ticket.followers,
            to: [...ticket.followers, follower._id],
          },
        },
      },
    });

    return {
      success: true,
      message: `Successfully added follower ${follower.name} to ticket ${ticketId}`,
    };
  }

  async removeFollower(ticketId: string, followerId: string, userId: string) {
    const createdBy = await this.usersService.findOneByCondition({
      partyId: userId,
    });
    if (!createdBy) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const ticket = await this.ticketsRepository.findOneById(ticketId);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${ticketId} not found`);
    }

    const follower = await this.usersService.findOne(followerId);
    if (!follower) {
      throw new NotFoundException(`Follower with ID ${followerId} not found`);
    }

    if (!ticket.followers.some((followerId) => followerId.toString() === follower._id.toString())) {
      throw new BadRequestException(`Follower ${followerId} is not following the ticket`);
    }

    // Remove follower
    await this.ticketsRepository.update(ticketId, {
      followers: ticket.followers.filter(
        (followerId) => followerId.toString() !== follower._id.toString(),
      ),
    });

    // Create activity
    await this.activitiesService.create({
      type: ActivityType.TICKET_UPDATED,
      description: `User ${follower.name} stopped following the ticket`,
      ticket: ticketId,
      createdBy: {
        id: createdBy._id,
        name: createdBy.name,
      },
      metadata: {
        logType: ActivityLogType.TICKET_UPDATED,
        changes: {
          followers: {
            from: ticket.followers,
            to: ticket.followers.filter(
              (followerId) => followerId.toString() !== follower._id.toString(),
            ),
          },
        },
      },
    });

    return {
      success: true,
      message: `Successfully removed follower ${follower.name} from ticket ${ticketId}`,
    };
  }
}
