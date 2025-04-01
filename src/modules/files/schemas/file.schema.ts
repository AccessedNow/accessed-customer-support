import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { FileStatus } from 'src/common/enums/file-status.enum';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export type FileDocument = File & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class File extends BaseSchema {
  @Prop({ type: String })
  fileId: string;

  @Prop({ enum: FileStatus, default: FileStatus.ACTIVE })
  status: string;

  @Prop({ type: String, required: false })
  createdBy: string;

  @Prop({ type: String, required: false })
  lastModifiedBy: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: false })
  fileSize: number;

  @Prop({ required: true, default: 'original' })
  size: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  uploadDate: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Ticket', required: true })
  ticket: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Note', required: false, default: null })
  note: MongooseSchema.Types.ObjectId;
}

export const FileSchema = SchemaFactory.createForClass(File);
FileSchema.plugin(mongoosePaginate);
