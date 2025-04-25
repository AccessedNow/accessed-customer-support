import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { BaseUserSchema } from 'src/core/schemas/base-user.schema';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User extends BaseUserSchema {
  @Prop({ required: true })
  partyId: string;

  @Prop({ required: false, default: [] })
  components: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.plugin(mongoosePaginate);
