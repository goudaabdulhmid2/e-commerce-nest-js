import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from 'src/users/schemas/user.schema';

export type RevokedTokenDocument =
  HydratedDocument<RevokedToken>;

@Schema({
  timestamps: true,
})
export class RevokedToken {

  @Prop({
    type: String,
    required: true,
  })
  tokenId!: string;

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
  expireTime!: Date;
}

export const RevokedTokenSchema =
  SchemaFactory.createForClass(RevokedToken);