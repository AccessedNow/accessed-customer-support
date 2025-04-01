import { File } from 'src/modules/files/schemas/file.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface FilesRepositoryInterface extends BaseRepositoryInterface<File> {}
