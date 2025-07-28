import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Scope,
} from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Note } from './schemas/note.schema';
import { NotesRepositoryInterface } from 'src/core/repositories/interfaces/notes.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FilterMap, QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { ActivitiesService } from '../activities/activities.service';
import { ActivityLogType, ActivityType } from '../activities/schemas/activity.schema';
import { Types } from 'mongoose';
import { FilesService } from '../files/files.service';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';
import { RabbitmqService } from 'src/common/services/rabbitmq.service';
import { NotificationHelper } from 'src/common/helpers/notification.helper';

@Injectable({ scope: Scope.REQUEST })
export class NotesService extends BaseServiceAbstract<Note> {
  protected readonly logger = new Logger(NotesService.name);

  constructor(
    @Inject('NotesRepositoryInterface')
    protected readonly notesRepository: NotesRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
    private readonly activitiesService: ActivitiesService,
    private readonly filesService: FilesService,
    private readonly ticketsService: TicketsService,
    private readonly usersService: UsersService,
    private readonly rabbitmqService: RabbitmqService,
  ) {
    super(notesRepository, httpService, configService, new Logger(NotesService.name));
  }

  async findAll({ ticketId, query }: { ticketId: string; query: any }) {
    const filterMap: FilterMap = {
      ticket: 'ticket',
      type: 'type',
      createdBy: 'createdBy.id',
    };
    const conditions = QueryBuilderUtil.buildFilterConditions(
      { ...query, ticket: new Types.ObjectId(ticketId) },
      filterMap,
    );
    const options = QueryBuilderUtil.buildQueryOptions(query);
    const populateOptions = {
      populate: [
        {
          path: 'createdBy',
          select: 'id name avatar',
        },
        {
          path: 'files',
          select: 'fileId path fileType',
        },
      ],
      sort: { createdAt: -1 },
    };

    return await this.notesRepository.findAll(conditions, {
      ...options,
      ...populateOptions,
    });
  }

  async findOneByTicketAndId({ ticketId, id }: { ticketId: string; id: string }) {
    const note = await this.notesRepository.findOneByCondition({
      _id: id,
      ticket: new Types.ObjectId(ticketId),
    });
    if (!note) throw new NotFoundException('Note not found');

    const populateOptions = {
      populate: [
        {
          path: 'files',
          select: 'fileId path fileType filename',
          options: {
            sort: { createdAt: -1 },
          },
          match: { note: id },
        },
      ],
    };

    return this.notesRepository.findOneById(id, null, populateOptions);
  }

  async createNote({
    ticketId,
    createNoteDto,
    user,
  }: {
    ticketId: string;
    createNoteDto: CreateNoteDto;
    user: any;
  }) {
    const ticket = await this.ticketsService.findOneById(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');

    const createdBy = await this.usersService.findUserFromPartyService(user.id);
    const note = await this.notesRepository.create({
      ...createNoteDto,
      ticket: new Types.ObjectId(ticketId),
      createdBy: {
        id: createdBy._id.toString(),
        name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
        avatar: createdBy.avatar,
      },
    });

    const activity = await this.activitiesService.create({
      type: ActivityType.NOTE_CREATED,
      description: `Note created for ticket ${ticket.ticketId}`,
      createdBy: {
        id: createdBy._id.toString(),
        name: createdBy.name,
        avatar: createdBy.avatar,
      },
      ticket: ticket._id,
      metadata: {
        noteId: note._id,
        isPrivate: createNoteDto.isPrivate,
        logType: ActivityLogType.NOTE_CREATED,
      },
    });
    if (createNoteDto.files && createNoteDto.files.length > 0) {
      await Promise.all(
        createNoteDto.files.map((file) =>
          this.filesService.create({
            file,
            ticketId: ticket._id.toString(),
            noteId: note._id.toString(),
          }),
        ),
      );
    }

    // Send notification if ticket has assignee
    if (ticket?.assignee?.id) {
      const assignee = await this.usersService.findOne(ticket.assignee.id);
      if (assignee?.messengerId) {
        await this.sendAddNoteNotification(assignee, note, ticket, {
          id: createdBy._id.toString(),
          partyId: createdBy.partyId,
          name: createdBy.name || createdBy.firstName + ' ' + createdBy.lastName,
          email: createdBy.email,
          avatar: createdBy.avatar,
        });
      }
    }

    return { newNote: note, activity };
  }

  async updateNote({
    ticketId,
    id,
    updateNoteDto,
    user,
  }: {
    ticketId: string;
    id: string;
    updateNoteDto: UpdateNoteDto;
    user: any;
  }) {
    const note = await this.notesRepository.findOneByCondition({
      _id: id,
      ticket: new Types.ObjectId(ticketId),
    });
    if (!note) throw new NotFoundException('Note not found');

    const updatedBy = await this.usersService.findUserFromPartyService(user.id);
    if (!updatedBy) throw new NotFoundException('User not found');

    if (note.createdBy.id.toString() !== updatedBy._id.toString())
      throw new BadRequestException('You can only update your own notes');

    const changes: Record<string, { from: any; to: any }> = {};
    const updateData: Record<string, any> = {
      updatedBy: {
        id: updatedBy._id.toString(),
        name: updatedBy.name,
        avatar: updatedBy.avatar,
      },
    };

    if (updateNoteDto.content && updateNoteDto.content !== note.content) {
      changes['content'] = {
        from: note.content,
        to: updateNoteDto.content,
      };
      updateData['content'] = updateNoteDto.content;
    }

    if (updateNoteDto.isPrivate !== undefined && updateNoteDto.isPrivate !== note.isPrivate) {
      changes['isPrivate'] = {
        from: note.isPrivate,
        to: updateNoteDto.isPrivate,
      };
      updateData['isPrivate'] = updateNoteDto.isPrivate;
    }

    if (updateNoteDto.files && updateNoteDto.files.length > 0) {
      const existingFiles = (note as any).files || [];
      const newFiles = [];

      for (const file of updateNoteDto.files) {
        try {
          const createdFile = await this.filesService.create({
            file,
            ticketId,
            noteId: id,
          });

          newFiles.push({
            fileId: createdFile.fileId,
            path: createdFile.path,
            fileType: createdFile.fileType,
            filename: createdFile.filename || file.url.split('/').pop() || 'unknown',
          });
        } catch (error) {
          this.logger.error(`Error creating file: ${error.message}`);
        }
      }
      if (newFiles.length > 0) {
        changes['files'] = {
          from: existingFiles.length,
          to: existingFiles.length + newFiles.length,
        };

        const metadataChanges = { filesAdded: newFiles.length };
        updateData.metadataChanges = metadataChanges;
        updateData.files = [...existingFiles, ...newFiles];
      }
    }

    if (Object.keys(changes).length === 0) {
      return note;
    }

    let activityType = ActivityType.NOTE_UPDATED;
    let activityLogType = ActivityLogType.NOTE_UPDATED;
    let description = `Note updated for ticket ${ticketId}`;

    const activity = await this.activitiesService.create({
      type: activityType,
      description: description,
      createdBy: {
        id: updatedBy._id.toString(),
        name: updatedBy.name,
        avatar: updatedBy.avatar,
      },
      ticket: ticketId,
      metadata: {
        noteId: id,
        isPrivate: updateData.isPrivate !== undefined ? updateData.isPrivate : note.isPrivate,
        logType: activityLogType,
        changes: changes,
        ...(updateData.metadataChanges || {}),
      },
    });
    if (updateData.metadataChanges) {
      delete updateData.metadataChanges;
    }

    const noteUpdated = await this.notesRepository.update(id, updateData);

    // Send notification if ticket has assignee
    const ticket = await this.ticketsService.findOneById(ticketId);
    if (ticket?.assignee?.id) {
      const assignee = await this.usersService.findOne(ticket.assignee.id);
      if (assignee?.messengerId) {
        await this.sendUpdateNoteNotification(assignee, noteUpdated, note.content, ticket, {
          id: updatedBy._id.toString(),
          partyId: updatedBy.partyId,
          name: updatedBy.name || updatedBy.firstName + ' ' + updatedBy.lastName,
          email: updatedBy.email,
          avatar: updatedBy.avatar,
        });
      }
    }

    return { noteUpdated, activity };
  }

  async delete({ ticketId, id, user }: { ticketId: string; id: string; user: any }) {
    const noteExists = await this.notesRepository.findOneByCondition({
      _id: id,
      ticket: new Types.ObjectId(ticketId),
    });
    if (!noteExists) throw new NotFoundException('Note not found');
    const deletedBy = await this.usersService.findUserFromPartyService(user.id);
    if (noteExists.createdBy.id.toString() !== deletedBy._id.toString())
      throw new BadRequestException('You can only delete your own notes');

    const note = await this.notesRepository.softDelete(id);
    if (!note) throw new NotFoundException('Note not found');

    const activity = await this.activitiesService.create({
      type: ActivityType.NOTE_DELETED,
      description: `Note deleted from ticket ${ticketId}`,
      createdBy: {
        id: deletedBy._id.toString(),
        name: deletedBy.name,
        avatar: deletedBy.avatar,
      },
      ticket: ticketId,
      metadata: {
        noteId: id,
        logType: ActivityLogType.NOTE_DELETED,
      },
    });

    // Send notification if ticket has assignee
    const ticket = await this.ticketsService.findOneById(ticketId);
    if (ticket?.assignee?.id) {
      const assignee = await this.usersService.findOne(ticket.assignee.id);
      if (assignee?.messengerId) {
        await this.sendDeleteNoteNotification(assignee, noteExists, ticket, {
          id: deletedBy._id.toString(),
          partyId: deletedBy.partyId,
          name: deletedBy.name || deletedBy.firstName + ' ' + deletedBy.lastName,
          email: deletedBy.email,
          avatar: deletedBy.avatar,
        });
      }
    }

    return { success: true, activity };
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
   * Get all notification recipients from ticket (assignee + followers) without duplicates
   */
  private async getNotificationRecipientsFromTicket(ticket: any): Promise<any[]> {
    const recipients: any[] = [];
    const recipientIds = new Set<string>();

    // Add ticket assignee if exists
    if (ticket?.assignee?.id) {
      const assignee = await this.usersService.findOne(ticket.assignee.id);
      if (assignee?.messengerId && !recipientIds.has(assignee._id.toString())) {
        recipients.push(assignee);
        recipientIds.add(assignee._id.toString());
      }
    }

    // Add ticket followers
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
    recipients: any[],
    createNotificationData: (recipient: any) => any,
    eventType: string,
  ): Promise<void> {
    const notificationPromises = recipients.map(async (recipient) => {
      const notificationData = createNotificationData(recipient);
      return this.sendNotification(notificationData, eventType);
    });

    await Promise.all(notificationPromises);
  }

  /**
   * Send add note notification
   */
  private async sendAddNoteNotification(
    assignee: any,
    note: any,
    ticket: any,
    createdBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients from ticket (assignee + followers)
    const recipients = await this.getNotificationRecipientsFromTicket(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createAddNoteNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          note: {
            id: note._id.toString(),
            content: note.content,
            ticketId: note.ticket.toString(),
          },
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
          },
          createdBy,
        }),
      'ADD_NOTE',
    );
  }

  /**
   * Send update note notification
   */
  private async sendUpdateNoteNotification(
    assignee: any,
    note: any,
    previousContent: string,
    ticket: any,
    updatedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients from ticket (assignee + followers)
    const recipients = await this.getNotificationRecipientsFromTicket(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createUpdateNoteNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          note: {
            id: note._id.toString(),
            content: note.content,
            ticketId: note.ticket.toString(),
          },
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
          },
          previousContent,
          updatedBy,
        }),
      'UPDATE_NOTE',
    );
  }

  /**
   * Send delete note notification
   */
  private async sendDeleteNoteNotification(
    assignee: any,
    note: any,
    ticket: any,
    deletedBy?: any,
  ): Promise<void> {
    if (!assignee?.messengerId) return;

    // Get all recipients from ticket (assignee + followers)
    const recipients = await this.getNotificationRecipientsFromTicket(ticket);

    await this.sendNotificationToRecipients(
      recipients,
      (recipient) =>
        NotificationHelper.createDeleteNoteNotification({
          messengerId: recipient.messengerId,
          assigneeName: recipient.name,
          assigneePartyId: recipient.partyId,
          note: {
            id: note._id.toString(),
            content: note.content,
            ticketId: note.ticket.toString(),
          },
          ticket: {
            id: ticket._id.toString(),
            ticketId: ticket.ticketId,
            subject: ticket.subject,
          },
          deletedBy,
        }),
      'DELETE_NOTE',
    );
  }
}
