import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { Note, NoteSchema } from './schemas/note.schema';
import { NotesRepository } from 'src/core/repositories/notes.repository';
import { ActivitiesModule } from '../activities/activities.module';
import { FilesModule } from '../files/files.module';
import { TicketsModule } from '../tickets/tickets.module';
import { UsersModule } from '../users/users.module';
import { RabbitmqModule } from '../../common/modules/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Note.name, schema: NoteSchema }]),
    HttpModule,
    ActivitiesModule,
    FilesModule,
    TicketsModule,
    UsersModule,
    RabbitmqModule,
  ],
  controllers: [NotesController],
  providers: [NotesService, { provide: 'NotesRepositoryInterface', useClass: NotesRepository }],
  exports: [NotesService],
})
export class NotesModule {}
