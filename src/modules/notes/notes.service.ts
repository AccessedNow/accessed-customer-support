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
        name: createdBy.name,
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

    return { success: true, activity };
  }
}
