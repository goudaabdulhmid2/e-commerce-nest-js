import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

import { OtpTypes } from 'src/auth/enums/otpType.enum';
import { User } from 'src/users/schemas/user.schema';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({
  timestamps: true,
})
export class Otp {
  @Prop({
    type: String,
    required: true,
    select: false,
  })
  otp!: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: Date,
    required: true,
  })
  expiresAt!: Date;

  @Prop({
    type: String,
    enum: OtpTypes,
    required: true,
  })
  otpType!: OtpTypes;

  @Prop({
    type: Number,
    default: 0,
  })
  attempts!: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  isUsed!: boolean;
}

export const OtpSchema =
  SchemaFactory.createForClass(Otp);