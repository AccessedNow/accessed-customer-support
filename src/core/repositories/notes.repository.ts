import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { NotesRepositoryInterface } from './interfaces/notes.interface';
import { Note } from 'src/modules/notes/schemas/note.schema';
import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';

@Injectable()
export class NotesRepository
  extends BaseRepositoryAbstract<Note>
  implements NotesRepositoryInterface
{
  constructor(
    @InjectModel(Note.name)
    private readonly notesRepository: Model<Note>,
  ) {
    super(notesRepository);
  }
}
