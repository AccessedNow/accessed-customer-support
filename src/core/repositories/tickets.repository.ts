import { Injectable } from '@nestjs/common';
import { Ticket } from 'src/modules/tickets/schemas/ticket.schema';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { TicketsRepositoryInterface } from './interfaces/tickets.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class TicketsRepository
  extends BaseRepositoryAbstract<Ticket>
  implements TicketsRepositoryInterface
{
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketsRepository: Model<Ticket>,
  ) {
    super(ticketsRepository);
  }
}
