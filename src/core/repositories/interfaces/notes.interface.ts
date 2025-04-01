import { Note } from 'src/modules/notes/schemas/note.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface NotesRepositoryInterface extends BaseRepositoryInterface<Note> {}
