import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { ProcessedEventType } from "../enums/processed-event-type.enum";


export type ProcessedEventDocument = 
    HydratedDocument<ProcessedEvent>

@Schema({
    timestamps:true
})
export class ProcessedEvent{

    @Prop({
        required: true,
        type: Types.ObjectId,
        unique: true,
        index: true
    })
    eventId!: Types.ObjectId;
    
    @Prop({
        required:true,
    })
    eventType!: ProcessedEventType

    @Prop({
        required: true
    })
    processedAt!: Date
}

export const ProcessedEventSchema =
    SchemaFactory.createForClass(ProcessedEvent)