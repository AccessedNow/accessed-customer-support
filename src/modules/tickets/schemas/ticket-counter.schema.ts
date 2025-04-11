import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TicketCounterDocument = TicketCounter & Document;

@Schema({ collection: 'ticket_counters' })
export class TicketCounter {
  @Prop({ required: true, unique: true })
  prefix: string;

  @Prop({ required: true, default: 0 })
  sequence: number;
}

export const TicketCounterSchema = SchemaFactory.createForClass(TicketCounter);
