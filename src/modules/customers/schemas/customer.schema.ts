import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { UserSchema } from 'src/core/schemas/user.schema';

export type CustomerDocument = Customer & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Customer extends UserSchema {
  @Prop({ required: true })
  customerId: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.plugin(mongoosePaginate);
