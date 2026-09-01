import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { OutboxStatus } from "../enums/outbox-status.enum";


export type OutboxDocument = HydratedDocument<Outbox>

@Schema({
    timestamps: true
})
export class Outbox{

    // Event type
    @Prop({
        required: true,
        index: true,
        type: String
    })
    type!: string;

    // Event payload
    @Prop({
        required: true,
        type: Object
    })
    payload!: Record<string, unknown>

    // processing status
    @Prop({
        requird: true,
        enum: OutboxStatus,
        default: OutboxStatus.PENDING,
        index: true
    })
    status!: OutboxStatus

    // Number of processing attempts
    @Prop({
        default: 0,
        type: Number
    })
    attempts!: number;

    // processing timestamp
    @Prop({
        type: Date
    })
    processedAt!: Date



}


export const OutboxSchema = 
    SchemaFactory.createForClass(Outbox)