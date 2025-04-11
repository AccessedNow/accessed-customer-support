import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { File } from 'src/modules/files/schemas/file.schema';
import { FilesRepositoryInterface } from './interfaces/files.interface';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';

@Injectable()
export class FilesRepository
  extends BaseRepositoryAbstract<File>
  implements FilesRepositoryInterface
{
  constructor(
    @InjectModel(File.name)
    private readonly filesRepository: Model<File>,
  ) {
    super(filesRepository);
  }
}
