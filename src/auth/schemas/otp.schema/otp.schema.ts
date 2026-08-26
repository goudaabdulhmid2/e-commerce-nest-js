import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { OtpTypes } from "src/auth/enums/otpType.enum";
import { User } from "src/users/schemas/user.schema";

export type OtpDocument = HydratedDocument<Otp>;


@Schema({
   timestamps:true
})
export class Otp {

    @Prop({
        type:String,
        required:true
    })
    otp!: string

    @Prop({
        type:Types.ObjectId,
        ref: User.name,
        required:true
    })
    userId!: string | Types.ObjectId;

    @Prop({
        type:Date,
        required:true
    })
    expireTime!: Date

    @Prop({
        type:String,
        enum: OtpTypes,
        required:true
    })
    otpType!:string

}

export const OtpSchema =
  SchemaFactory.createForClass(Otp);
