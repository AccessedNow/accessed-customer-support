import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Ticket } from './schemas/ticket.schema';
import { TicketsRepositoryInterface } from 'src/core/repositories/interfaces/tickets.interface';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FindAllResponse } from 'src/common/types/common.type';
import { ActivitiesService } from '../activities/activities.service';
import {
  TicketStatus,
  Priority,
  TICKET_TYPE_PREFIX_MAP,
  TICKET_TYPE,
  TYPE_TO_SUBTYPE,
  TICKET_SUBTYPE,
} from 'src/common/enums/ticket.enum';
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
import { firstValueFrom } from 'rxjs';
import * as _ from 'lodash';
import { CUSTOMER_FIELDS } from './dto/customer-info.dto';
import { HttpClientFactoryService } from 'src/common/services/http-client-factory.service';
import { RabbitmqService } from 'src/common/services/rabbitmq.service';
import { NotificationHelper } from 'src/common/helpers/notification.helper';

@Injectable({ scope: Scope.REQUEST })
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
    private readonly httpClientFactory: HttpClientFactoryService,
    private readonly rabbitmqService: RabbitmqService,
  ) {
    super(ticketsRepository, httpService, configService, new Logger(TicketsService.name));
  }

  async create({
    createTicketDto,
    user,
  }: {
    createTicketDto: CreateTicketDto;
    user: any;
  }): Promise<Ticket> {
    const {
      ticketType,
      ticketSubtype,
      priority: dtoPriority,
      files,
      followers,
      assigneeId,
    } = createTicketDto;

    // Validate subtype belongs to type if provided (skip validation for custom values)
    if (
      ticketSubtype &&
      ticketType !== 'CUSTOM' &&
      ticketSubtype !== 'CUSTOM' &&
      !TYPE_TO_SUBTYPE[ticketType]?.includes(ticketSubtype)
    ) {
      throw new BadRequestException(
        `Invalid subtype ${ticketSubtype} for ticket type ${ticketType}`,
      );
    }

    // Extract customer fields from DTO
    const customerFields = _.pick(createTicketDto, CUSTOMER_FIELDS);
    const customer = await this.customersService.findCustomerFromPartyService(customerFields);
    const userExists = user && (await this.usersService.findUserFromPartyService(user.id));
    const prefix = TICKET_TYPE_PREFIX_MAP[ticketType] || 'AC';
    const priority = dtoPriority || TICKET_TYPE_PRIORITY_MAP[ticketType] || Priority.LOW;
    const sla = SLA_CONFIG[priority];
    const firstResponseDue = new Date(new Date().getTime() + sla.firstResponse * 60 * 60 * 1000);
    const resolutionDue = new Date(new Date().getTime() + sla.resolution * 60 * 60 * 1000);
    const [assignee, followersList, sequence] = await Promise.all([
      this.handleAssignee(assigneeId, ticketType),
      this.handleFollowers(followers),
      this.ticketCounterRepository.getNextSequence(prefix),
    ]);
    const ticketId = `#${prefix}-${sequence.toString().padStart(6, '0')}`;
    if (createTicketDto.meta?.invoice && ticketType === TICKET_TYPE.BILLING) {
      const paymentServiceUrl = this.configService.get<string>('PAYMENT_SERVICE_URL');
      const { data: invoice } = await firstValueFrom(
        this.httpService.get(`${paymentServiceUrl}/api/invoices/${createTicketDto.meta.invoice}`),
      );
      if (!invoice?.data) {
        throw new NotFoundException(`Invoice with ID ${createTicketDto.meta.invoice} not found`);
      }
      createTicketDto.meta.invoice = invoice.data;
    }

    // Handle custom ticket type and subtype
    const finalTicketType =
      createTicketDto.ticketType === 'CUSTOM'
        ? createTicketDto.customTicketType
        : createTicketDto.ticketType;

    const finalTicketSubtype =
      createTicketDto.ticketSubtype === 'CUSTOM'
        ? createTicketDto.customTicketSubtype
        : createTicketDto.ticketSubtype;

    const ticketData = {
      ...createTicketDto,
      ticketId,
      ticketType: finalTicketType,
      ticketSubtype: finalTicketSubtype,
      // Store custom values if provided
      customTicketType:
        createTicketDto.ticketType === 'CUSTOM' ? createTicketDto.customTicketType : undefined,
      customTicketSubtype:
        createTicketDto.ticketSubtype === 'CUSTOM'
          ? createTicketDto.customTicketSubtype
          : undefined,
      customer: {
        id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        avatar: customer.avatar,
      },
      createdBy: user
        ? {
            id: userExists._id,
            partyId: userExists.partyId,
            name: userExists.name,
            avatar: userExists.avatar,
          }
        : {
            id: customer._id,
            customerId: customer.customerId,
            name: customer.name,
            avatar: customer.avatar,
          },
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
      followers: followersList.map((follower) => follower._id),
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
        ticketType: ticketType,
        ticketSubtype: ticketSubtype,
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

    if (files && files.length > 0) {
      await Promise.all(
        files.map((file) => this.filesService.create({ file, ticketId: ticket._id.toString() })),
      );
    }

    const _messageClient = this.httpClientFactory.getClient('message', {
      baseURL: this.configService.get<string>('MESSAGE_SERVICE_URL'),
      timeout: 15000,
      retries: 2,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    // await messageClient.post('/sys/mails/send', {
    //   type: 'SUPPORT_TICKET_NOTIFICATION',
    //   dataSupportTicketNotification: {
    //     ticketId: ticketId,
    //     customerName: customer.name,
    //     customerEmail: customer.email,
    //     priorityLevel: priority.toUpperCase(),
    //     priorityLevelLower: priority.toLowerCase(),
    //     ticketSubject: createTicketDto.subject,
    //     ticketCategory: ticketType,
    //     createdDate: new Date().toISOString().split('T')[0],
    //     ticketStatus: TicketStatus.OPEN,
    //     ticketDescription: createTicketDto.message,
    //     viewTicketUrl: ticket._id.toString(),
    //   },
    // });
    // if (assignee?.messengerId && customer?.messengerId) {
    //   const { data: conversation } = await messageClient.post('/sys/conversations', {
    //     type: 'SUPPORT',
    //     members: [assignee?.messengerId, customer?.messengerId],
    //     title: '',
    //     meta: {
    //       ticketId: ticket._id.toString(),
    //       customerId: customer.customerId,
    //     },
    //   });
    //   if (conversation?.data) {
    //     ticket.meta.conversationId = conversation.data._id;
    //   }
    // }

    // Send notification if ticket has assignee
    if (assignee) {
      const assignedByData = user
        ? {
            id: userExists._id.toString(),
            partyId: userExists.partyId,
            name: userExists.name || userExists.firstName + ' ' + userExists.lastName,
            email: userExists?.email || '',
            avatar: userExists.avatar,
          }
        : {
            id: customer._id.toString(),
            partyId: customer.customerId,
            name: customer.name || customer.firstName + ' ' + customer.lastName,
            email: customer?.email || '',
            avatar: customer.avatar,
          };

      await this.sendTicketAssignNotification(assignee, ticket, assignedByData);
    }

    return ticket;
  }

  private async handleAssignee(assigneeId?: string, type?: string): Promise<User | null> {
    if (assigneeId) {
      const assignee = await this.usersService.findUserFromPartyService(assigneeId);
      if (!assignee) {
        throw new NotFoundException(`Assignee with ID ${assigneeId} not found`);
      }
      return assignee;
    }

    const { content: users } = await this.usersService.findAll({
      components: { $in: [type] },
    });
    if (users.length === 0) {
      return null;
    }

    if (users.length === 1) {
      return users[0];
    }

    const userTicketCounts = await Promise.all(
      users.map(async (user) => {
        const { content: tickets } = await this.ticketsRepository.findAll({
          'assignee.partyId': user.partyId,
          status: { $ne: TicketStatus.CLOSED },
        });

        return {
          user,
          ticketCount: tickets.length,
        };
      }),
    );
    userTicketCounts.sort((a, b) => a.ticketCount - b.ticketCount);

    const selectedUser = userTicketCounts[0].user;

    return selectedUser;
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
      ticketSubtype: 'ticketSubtype',
      priority: 'priority',
      assignedTo: 'assignee.id',
      customerId: 'customer.customerId',
      customTicketType: 'customTicketType',
      customTicketSubtype: 'customTicketSubtype',
    };

    const conditions = QueryBuilderUtil.buildFilterConditions(query, filterMap);
    const options = QueryBuilderUtil.buildQueryOptions(query);

    const result = await this.ticketsRepository.findAll(conditions, options);
    return result;
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

    const basicFields = ['subject', 'message'];
    for (const field of basicFields) {
      if (updateTicketDto[field] !== undefined && updateTicketDto[field] !== ticket[field]) {
        changes[field] = { from: ticket[field], to: updateTicketDto[field] };
        updateData[field] = updateTicketDto[field];
      }
    }

    // Handle ticketType separately to support custom values
    if (
      updateTicketDto.ticketType !== undefined &&
      updateTicketDto.ticketType !== ticket.ticketType
    ) {
      const finalTicketType =
        updateTicketDto.ticketType === 'CUSTOM'
          ? updateTicketDto.customTicketType
          : updateTicketDto.ticketType;

      changes['ticketType'] = { from: ticket.ticketType, to: finalTicketType };
      updateData['ticketType'] = finalTicketType;

      if (updateTicketDto.ticketType === 'CUSTOM') {
        updateData['customTicketType'] = updateTicketDto.customTicketType;
      }
    }

    // Handle ticketSubtype validation and changes
    if (
      updateTicketDto.ticketSubtype !== undefined &&
      updateTicketDto.ticketSubtype !== ticket.ticketSubtype
    ) {
      const ticketType = updateTicketDto.ticketType || ticket.ticketType;

      // Skip validation for custom values
      if (
        updateTicketDto.ticketSubtype &&
        ticketType !== 'CUSTOM' &&
        updateTicketDto.ticketSubtype !== 'CUSTOM' &&
        !TYPE_TO_SUBTYPE[ticketType]?.includes(updateTicketDto.ticketSubtype)
      ) {
        throw new BadRequestException(
          `Invalid subtype ${updateTicketDto.ticketSubtype} for ticket type ${ticketType}`,
        );
      }

      // Handle custom subtype
      const finalTicketSubtype =
        updateTicketDto.ticketSubtype === 'CUSTOM'
          ? updateTicketDto.customTicketSubtype
          : updateTicketDto.ticketSubtype;

      changes['ticketSubtype'] = { from: ticket.ticketSubtype, to: finalTicketSubtype };
      updateData['ticketSubtype'] = finalTicketSubtype;

      if (updateTicketDto.ticketSubtype === 'CUSTOM') {
        updateData['customTicketSubtype'] = updateTicketDto.customTicketSubtype;
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
    let newAssignee = null;
    if (
      assigneeId &&
      (!ticket?.assignee?.assigneeId || assigneeId !== ticket.assignee?.assigneeId)
    ) {
      newAssignee = await this.handleAssignee(assigneeId);
      changes['assigneeId'] = {
        from: ticket?.assignee?.assigneeId,
        to: assigneeId,
      };

      updateData['assigneeId'] = assigneeId;
      updateData['assignee'] = {
        id: newAssignee._id?.toString(),
        partyId: newAssignee.partyId,
        name: newAssignee.name || newAssignee.firstName + ' ' + newAssignee.lastName,
        email: newAssignee?.email || '',
        avatar: newAssignee.avatar,
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

    await this.handleClosedTicket(updatedTicket);

    // Send ADD_FOLLOW_UP notifications
    if (changes['message'] && updatedTicket?.assignee?.id) {
      const assignee = await this.usersService.findOne(updatedTicket.assignee.id);
      if (assignee?.messengerId) {
        const followUpContent = changes['message'].to;
        const addedByData = {
          id: createdBy._id.toString(),
          partyId: createdBy.partyId,
          name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
          email: createdBy?.email || '',
          avatar: createdBy.avatar,
        };
        await this.sendAddFollowUpNotification(
          assignee,
          updatedTicket,
          followUpContent,
          addedByData,
        );
      }
    }

    if (changes['files'] && updatedTicket?.assignee?.id) {
      const assignee = await this.usersService.findOne(updatedTicket.assignee.id);
      if (assignee?.messengerId) {
        const followUpContent = `Added ${changes['files'].to.length} file(s): ${changes['files'].to.join(', ')}`;
        const addedByData = {
          id: createdBy._id.toString(),
          partyId: createdBy.partyId,
          name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
          email: createdBy?.email || '',
          avatar: createdBy.avatar,
        };
        await this.sendAddFollowUpNotification(
          assignee,
          updatedTicket,
          followUpContent,
          addedByData,
        );
      }
    }

    // Send notifications for changes
    if (newAssignee && changes['assigneeId']) {
      const assignedByData = {
        id: createdBy._id.toString(),
        partyId: createdBy.partyId,
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
        email: createdBy?.email || '',
        avatar: createdBy.avatar,
      };
      await this.sendTicketChangeAssigneeNotification(
        newAssignee,
        updatedTicket,
        ticket.assignee?.name || ticket.assignee?.firstName + ' ' + ticket.assignee?.lastName,
        assignedByData,
      );
    }

    if (changes['status'] && updatedTicket.assignee?.id) {
      const assignee = await this.usersService.findOne(updatedTicket.assignee.id);
      if (assignee) {
        const changedByData = {
          id: createdBy._id.toString(),
          partyId: createdBy.partyId,
          name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
          email: createdBy?.email || '',
          avatar: createdBy.avatar,
        };
        await this.sendTicketStatusChangeNotification(
          assignee,
          updatedTicket,
          changes['status'].from,
          changes['status'].to,
          changedByData,
        );
      }
    }

    if (changes['priority'] && updatedTicket.assignee?.id) {
      const assignee = await this.usersService.findOne(updatedTicket.assignee.id);
      if (assignee) {
        const changedByData = {
          id: createdBy._id.toString(),
          partyId: createdBy.partyId,
          name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
          email: createdBy?.email || '',
          avatar: createdBy.avatar,
        };
        await this.sendTicketPriorityChangeNotification(
          assignee,
          updatedTicket,
          changes['priority'].from,
          changes['priority'].to,
          changedByData,
        );
      }
    }

    // Convert Mongoose document to plain object and return only necessary data
    const plainTicket = this.transformTicketResponse(updatedTicket);

    // Add activity to the response without changing the return type
    (plainTicket as any).activity = activity;

    return plainTicket as Ticket;
  }

  private async handleClosedTicket(ticket: Ticket) {
    switch (ticket.status) {
      case TicketStatus.CLOSED:
        // TODO: Call to party service to deactivate account, send email to customer
        if (
          ticket.ticketType === TICKET_TYPE.ACCOUNT &&
          ticket.ticketSubtype === TICKET_SUBTYPE.ACCOUNT_DEACTIVATION
        ) {
          const partyClient = this.httpClientFactory.getClient('party', {
            baseURL: this.configService.get<string>('PARTY_SERVICE_URL'),
            timeout: 15000,
            retries: 2,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          await partyClient.post(
            `/api/admin/customers/${ticket.createdBy?.customerId}/unblock`,
            null,
          );
          // TODO: Send email to customer
        }
        break;
      default:
        break;
    }
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
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
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
    } else if (changes.ticketType) {
      activityLogType = ActivityLogType.TYPE_CHANGED;
      activityType = ActivityType.TYPE_CHANGED;
      description = `Type changed from ${changes.ticketType.from} to ${changes.ticketType.to}`;
    } else if (changes.ticketSubtype) {
      activityLogType = ActivityLogType.SUBTYPE_CHANGED;
      activityType = ActivityType.SUBTYPE_CHANGED;
      description = `Subtype changed from ${changes.ticketSubtype.from || 'none'} to ${changes.ticketSubtype.to || 'none'}`;
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
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
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
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
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
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
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

  /**
   * Send notification via RabbitMQ
   */
  private async sendNotification(notificationData: any, eventType: string): Promise<void> {
    try {
      this.rabbitmqService.sendToNotificationQueue(notificationData).subscribe({
        next: (_result) => {
          this.logger.log(`${eventType} notification sent successfully`);
        },
        error: (error) => {
          this.logger.error(`Failed to send ${eventType} notification: ${error.message}`, error);
        },
      });
    } catch (error) {
      this.logger.error(`Error creating ${eventType} notification: ${error.message}`, error);
    }
  }

  /**
   * Get all notification recipients (assignee + followers) without duplicates
   */
  private async getNotificationRecipients(ticket: any): Promise<User[]> {
    const recipients: User[] = [];
    const recipientIds = new Set<string>();

    // Add assignee if exists
    if (ticket?.assignee?.id) {
      const assignee = await this.usersService.findOne(ticket.assignee.id);
      if (assignee?.messengerId && !recipientIds.has(assignee._id.toString())) {
        recipients.push(assignee);
        recipientIds.add(assignee._id.toString());
      }
    }

    // Add followers
    if (ticket?.followers && ticket.followers.length > 0) {
      for (const followerId of ticket.followers) {
        if (!recipientIds.has(followerId.toString())) {
          const follower = await this.usersService.findOne(followerId);
          if (follower?.messengerId) {
            recipients.push(follower);
            recipientIds.add(follower._id.toString());
          }
        }
      }
    }

    return recipients;
  }

  /**
   * Send notification to multiple recipients
   */
  private async sendNotificationToRecipients(
    recipients: User[],
    createNotificationData: (recipient: User) => any,
    eventType: string,
  ): Promise<void> {
    const notificationPromises = recipients.map(async (recipient) => {
      const notificationData = createNotificationData(recipient);
      return this.sendNotification(notificationData, eventType);
    });

    await Promise.all(notificationPromises);
  }

  /**
   * Send ticket assignment notification
   */
  private async sendTicketAssignNotification(
    assignee: User,
    ticket: any,
    assignedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients (assignee + followers)
    const recipients = await this.getNotificationRecipients(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createTicketAssignNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            ticketType: ticket.ticketType,
            priority: ticket.priority,
          },
          assignedBy,
        }),
      'ASSIGN_TICKET',
    );
  }

  /**
   * Send ticket reassignment notification
   */
  private async sendTicketChangeAssigneeNotification(
    assignee: User,
    ticket: any,
    previousAssignee?: string,
    assignedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients (assignee + followers)
    const recipients = await this.getNotificationRecipients(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createTicketChangeAssigneeNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            ticketType: ticket.ticketType,
            priority: ticket.priority,
          },
          previousAssignee,
          assignedBy,
        }),
      'CHANGE_TICKET_ASSIGNEE',
    );
  }

  /**
   * Send ticket status change notification
   */
  private async sendTicketStatusChangeNotification(
    assignee: User,
    ticket: any,
    previousStatus: string,
    newStatus: string,
    changedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients (assignee + followers)
    const recipients = await this.getNotificationRecipients(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createTicketChangeStatusNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            ticketType: ticket.ticketType,
            priority: ticket.priority,
          },
          previousStatus,
          newStatus,
          changedBy,
        }),
      'CHANGE_TICKET_STATUS',
    );
  }

  /**
   * Send ticket priority change notification
   */
  private async sendTicketPriorityChangeNotification(
    assignee: User,
    ticket: any,
    previousPriority: string,
    newPriority: string,
    changedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients (assignee + followers)
    const recipients = await this.getNotificationRecipients(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createTicketChangePriorityNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
            ticketType: ticket.ticketType,
            priority: newPriority,
          },
          previousPriority,
          newPriority,
          changedBy,
        }),
      'CHANGE_TICKET_PRIORITY',
    );
  }

  /**
   * Send add follow up notification
   */
  private async sendAddFollowUpNotification(
    assignee: User,
    ticket: any,
    followUpContent: string,
    createdBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients (assignee + followers)
    const recipients = await this.getNotificationRecipients(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createAddFollowUpNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
          },
          followUpContent,
          createdBy,
        }),
      'ADD_FOLLOW_UP',
    );
  }
}

