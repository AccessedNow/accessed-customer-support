import { InjectModel } from '@nestjs/mongoose';

import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { Task } from 'src/modules/tasks/schemas/task.schema';
import { Model } from 'mongoose';
import { TasksRepositoryInterface } from './interfaces/tasks.interface';

@Injectable()
export class TasksRepository
  extends BaseRepositoryAbstract<Task>
  implements TasksRepositoryInterface
{
  constructor(
    @InjectModel(Task.name)
    private readonly tasksRepository: Model<Task>,
  ) {
    super(tasksRepository);
  }
}
