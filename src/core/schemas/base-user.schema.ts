import { Prop } from '@nestjs/mongoose';
import { BaseSchema } from './base/base.schema';
import { UserStatus } from 'src/common/enums/status.enum';

export class BaseUserSchema extends BaseSchema {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  firstName: string;

  @Prop({ required: false })
  lastName: string;

  @Prop({ required: false })
  middleName: string;

  @Prop({ required: false })
  email: string;

  @Prop({ required: false })
  phoneNumber: string;

  @Prop({ required: false })
  partyType: string;

  @Prop({ required: false })
  messengerId: string;

  @Prop({ required: false })
  city: string;

  @Prop({ required: false })
  state: string;

  @Prop({ required: false })
  country: string;

  @Prop({ required: false })
  countryCode: string;

  @Prop({ required: false })
  isoCode2: string;

  @Prop({ required: false })
  timezone: string;

  @Prop({ required: false })
  language: string;

  @Prop({ required: false })
  avatar: string;

  @Prop({ required: false, enum: UserStatus, default: UserStatus.ACTIVE })
  status: string;
}
