import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket, TicketSchema } from './schemas/ticket.schema';
import { TicketCounter, TicketCounterSchema } from './schemas/ticket-counter.schema';
import { TicketsRepository } from 'src/core/repositories/tickets.repository';
import { TicketCounterRepository } from 'src/core/repositories/ticket-counter.repository';
import { ActivitiesModule } from '../activities/activities.module';
import { CustomersModule } from '../customers/customers.module';
import { FilesModule } from '../files/files.module';
import { UsersModule } from '../users/users.module';
import { RabbitmqModule } from '../../common/modules/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: TicketSchema },
      { name: TicketCounter.name, schema: TicketCounterSchema },
    ]),
    HttpModule,
    ActivitiesModule,
    CustomersModule,
    FilesModule,
    UsersModule,
    RabbitmqModule,
  ],
  controllers: [TicketsController],
  providers: [
    TicketsService,
    { provide: 'TicketsRepositoryInterface', useClass: TicketsRepository },
    TicketCounterRepository,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
