import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export type NoteDocument = Note & Document;

@Schema({
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Note extends BaseSchema {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Ticket' })
  ticket: Types.ObjectId;

  @Prop({ type: Object, required: true })
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };

  @Prop({ type: Object })
  updatedBy?: {
    id: string;
    name: string;
    avatar?: string;
  };

  @Prop({ default: false })
  isPrivate: boolean;
}

export const NoteSchema = SchemaFactory.createForClass(Note);

NoteSchema.virtual('files', {
  ref: 'File',
  localField: '_id',
  foreignField: 'note',
  options: { sort: { createdAt: -1 } },
});

NoteSchema.plugin(mongoosePaginate);
