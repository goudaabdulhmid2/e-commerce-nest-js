import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { BaseRepository } from "src/common/database/repositories/base.repository";
import { ProcessedEvent, ProcessedEventDocument } from "../schemas/processed-event.schema";
import { Model, Types } from "mongoose";
import { ProcessedEventType } from "../enums/processed-event-type.enum";


@Injectable()
export class ProcessedEventRepository extends BaseRepository <ProcessedEventDocument>{
    constructor(
        @InjectModel(ProcessedEvent.name)
        processedEventModle: Model<ProcessedEventDocument>
    ){
        super(processedEventModle)
    }

    async existsByEvntId(
        eventId: Types.ObjectId
    ): Promise<boolean>{
        const event = 
            await this.model.exists({eventId}).exec()

            return !!event
    }

    async createProcessedEvent(
        eventId: Types.ObjectId,
        eventType: ProcessedEventType,

    ): Promise<ProcessedEventDocument>{
        return this.model.create({
            eventId,
            eventType,
            processedAt: new Date()            
        })
    }
}