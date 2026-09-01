import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Outbox, OutboxDocument } from "../schemas/outbox.schema";
import { ClientSession, Model } from "mongoose";
import { OutboxStatus } from "../enums/outbox-status.enum";
import { BaseRepository } from "src/common/database/repositories/base.repository";



@Injectable()
export class OutboxRepository extends BaseRepository<OutboxDocument>{
    constructor(
        @InjectModel(Outbox.name)
        private readonly outboxModel: Model<OutboxDocument>
    ){
        super(outboxModel)
    }

}