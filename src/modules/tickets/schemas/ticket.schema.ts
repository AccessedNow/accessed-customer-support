import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { Priority, TicketStatus, TicketType } from 'src/common/enums/ticket.enum';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export type TicketDocument = Ticket & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Ticket extends BaseSchema {
  @Prop({ required: true, unique: true })
  ticketId: string;

  @Prop({ type: Object, default: {} })
  customer: Record<string, any>;

  @Prop({ type: Object, default: {} })
  assignee: Record<string, any>;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: TicketType, default: TicketType.COMPANY_REVIEWS })
  ticketType: string;

  @Prop({ required: true, enum: Priority, default: Priority.MEDIUM })
  priority: string;

  @Prop({ required: true, enum: TicketStatus, default: TicketStatus.OPEN })
  status: string;

  @Prop({ default: 'web' })
  source: string;

  @Prop()
  firstResponseDue: Date;

  @Prop()
  resolutionDue: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Customer' })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User' })
  followers: MongooseSchema.Types.ObjectId[];
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

// Compound index for popular filter fields
TicketSchema.index({ status: 1, priority: 1, ticketType: 1 });
// Index for customerId because often query by customer
TicketSchema.index({ customerId: 1 });
// Index for sort
TicketSchema.index({ createdAt: -1 });
// Text index for search
TicketSchema.index(
  { subject: 'text', message: 'text' },
  {
    weights: {
      subject: 2, // subject important more than message
      message: 1,
    },
    name: 'TextIndex',
  },
);
// Index for assignee.id because often query by assignee
TicketSchema.index({ 'assignee.id': 1 });
TicketSchema.virtual('activities', {
  ref: 'Activity',
  localField: '_id',
  foreignField: 'ticket',
  options: {
    sort: { createdAt: -1 },
    match: { deletedAt: null },
  },
});

TicketSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'ticket',
  options: { sort: { createdAt: -1 }, match: { deletedAt: null } },
});

TicketSchema.virtual('notes', {
  ref: 'Note',
  localField: '_id',
  foreignField: 'ticket',
  options: { sort: { createdAt: -1 }, match: { deletedAt: null } },
  justOne: false,
  populate: {
    path: 'files',
    select: 'fileId fileType path createdAt',
    options: { sort: { createdAt: -1 }, match: { deletedAt: null } },
  },
});

TicketSchema.virtual('files', {
  ref: 'File',
  localField: '_id',
  foreignField: 'ticket',
  options: {
    sort: { createdAt: -1 },
    match: { note: null, deletedAt: null },
  },
});

TicketSchema.plugin(mongoosePaginate);
