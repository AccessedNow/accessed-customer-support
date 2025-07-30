import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from 'src/core/repositories/tasks.repository';
import { TicketsModule } from '../tickets/tickets.module';
import { ActivitiesModule } from '../activities/activities.module';
import { UsersModule } from '../users/users.module';
import { RabbitmqModule } from '../../common/modules/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    HttpModule,
    TicketsModule,
    ActivitiesModule,
    UsersModule,
    RabbitmqModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, { provide: 'TasksRepositoryInterface', useClass: TasksRepository }],
  exports: [TasksService],
})
export class TasksModule {}
