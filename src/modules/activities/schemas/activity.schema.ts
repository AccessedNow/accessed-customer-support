import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export enum ActivityType {
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_UPDATED = 'TICKET_UPDATED',
  TICKET_DELETED = 'TICKET_DELETED',
  NOTE_CREATED = 'NOTE_CREATED',
  NOTE_UPDATED = 'NOTE_UPDATED',
  NOTE_DELETED = 'NOTE_DELETED',
  TYPE_CHANGED = 'TYPE_CHANGED',
  SUBTYPE_CHANGED = 'SUBTYPE_CHANGED',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  NOTE_ADDED = 'NOTE_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  CALL = 'CALL',
  EMAIL = 'EMAIL',
  CLIENT_CONTACTED = 'CLIENT_CONTACTED',
  TASK_DELETED = 'TASK_DELETED',
}

export enum ActivityLogType {
  TICKET_CREATED = 'Ticket Created',
  TICKET_UPDATED = 'Ticket Updated',
  TICKET_DELETED = 'Ticket Deleted',
  NOTE_CREATED = 'Note Created',
  NOTE_UPDATED = 'Note Updated',
  NOTE_DELETED = 'Note Deleted',
  TYPE_CHANGED = 'Change Ticket Type to',
  SUBTYPE_CHANGED = 'Change Ticket Subtype to',
  PRIORITY_CHANGED = 'Change Ticket Priority to',
  STATUS_CHANGED = 'Change Ticket Status to',
  ASSIGNED = 'Assigned',
  NOTE_ADDED = 'Note Added',
  ATTACHMENT_ADDED = 'Attachment Added',
  TASK_CREATED = 'Task Created',
  TASK_UPDATED = 'Task Updated',
  TASK_COMPLETED = 'Task Completed',
  CALL = 'Going to call with',
  EMAIL = 'Send email to',
  CLIENT_CONTACTED = 'Client Contacted',
  TASK_DELETED = 'Task Deleted',
}

export type ActivityDocument = Activity & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Activity extends BaseSchema {
  @Prop({ required: true, enum: ActivityType })
  type: ActivityType;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Object, default: {} })
  createdBy: Record<string, any>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.plugin(mongoosePaginate);
