import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate-v2';
import { UserSchema } from 'src/core/schemas/user.schema';

export type EmployeeDocument = Employee & Document;

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Employee extends UserSchema {
  @Prop({ required: true })
  employeeId: string;
}

export const EmployeeSchema = SchemaFactory.createForClass(Employee);

EmployeeSchema.plugin(mongoosePaginate);
