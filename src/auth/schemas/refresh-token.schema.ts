import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Session } from "./session.schema";


export type RefreshTokenDocument = HydratedDocument<RefreshToken>

@Schema({
    timestamps: true
})
export class RefreshToken {
    // identify the session that owns this refresh token
    @Prop({
        type: Types.ObjectId,
        ref: Session.name,
        required: true,
        index: true
    })
    sessionId!: Types.ObjectId;

    // store a unique identfier for this refresh token
    @Prop({
        type: String,
        required: true,
        unique: true,
        index: true
    })
    tokenId!: string;

    // store only the hash ot the raw refersh token
    @Prop({
        required: true,
        type: String
    })
    tokenHash!: string;

    // store when this refresh token expires
    @Prop({
        required: true,
        index: true
    })
    expiresAt!: Date
    
    // store when this token was replaced by another token
    @Prop({
        type: Date
    })
    usedAt?: Date

    // store the identfier of the token that replaced this token
    @Prop({
        type:String
    })
    replacedByTokenId?: string;

    // Store when this spcific token was revoked
    @Prop({
        type: Date
    })
    revokedAt?: Date
}

export const RefreshTokenSchema = 
    SchemaFactory.createForClass(RefreshToken)