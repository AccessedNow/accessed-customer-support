import { BaseRepositoryInterface } from '../base/base.interface.repository';
import { Task } from 'src/modules/tasks/schemas/task.schema';

export interface TasksRepositoryInterface extends BaseRepositoryInterface<Task> {}
