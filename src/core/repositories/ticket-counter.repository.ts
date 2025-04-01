import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TICKET_TYPE_PREFIX_MAP } from 'src/common/enums/ticket.enum';
import {
  TicketCounter,
  TicketCounterDocument,
} from 'src/modules/tickets/schemas/ticket-counter.schema';

@Injectable()
export class TicketCounterRepository implements OnModuleInit {
  constructor(
    @InjectModel(TicketCounter.name)
    private readonly ticketCounterModel: Model<TicketCounterDocument>,
  ) {}

  async onModuleInit() {
    const prefixes = Object.values(TICKET_TYPE_PREFIX_MAP);
    await Promise.all(
      prefixes.map(async (prefix) => {
        const counter = await this.ticketCounterModel.findOne({ prefix });
        if (!counter) {
          await this.ticketCounterModel.create({
            prefix,
            sequence: 0,
          });
        }
      }),
    );
  }

  async getNextSequence(prefix: string): Promise<number> {
    const counter = await this.ticketCounterModel.findOneAndUpdate(
      { prefix },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true },
    );
    return counter.sequence;
  }
}
