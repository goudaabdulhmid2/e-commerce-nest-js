import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "src/users/schemas/user.schema";


export type SessionDocument = HydratedDocument<Session>


@Schema({
    timestamps: true
})
export class Session {

    // store the user who owns this authentication session
    @Prop({
        type: Types.ObjectId,
        ref: User.name,
        required: true,
        index: true
    })
    userId!: Types.ObjectId;

    // store the time when this session expires
    @Prop({
        type: Date,
        required: true,
        index: true
    })
    expiresAt!: Date

    // store the time where this session revoked

    @Prop({
        type: Date
    })
    revokedAt?: Date;

    // store the last time this session was used
    @Prop({
        type: Date
    })
    lastUsedAt!: Date;
}

export const SessionSchema = 
    SchemaFactory.createForClass(Session);
