import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { TaskPriority } from 'src/common/enums/task.enum';
import { TaskStatus } from 'src/common/enums/task.enum';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export type TaskDocument = Task & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Task extends BaseSchema {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  assignedTo: MongooseSchema.Types.ObjectId;

  @Prop({ type: Object, default: {} })
  assignee: Record<string, any>;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING })
  status: string;

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  priority: string;

  @Prop()
  dueDate: Date;

  @Prop({ type: Date })
  completedAt: Date;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.plugin(mongoosePaginate);
