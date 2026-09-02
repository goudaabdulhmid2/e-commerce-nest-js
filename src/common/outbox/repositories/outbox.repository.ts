import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Outbox, OutboxDocument } from "../schemas/outbox.schema";
import { ClientSession, Model, Types } from "mongoose";
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


    async claimPendingEvent(): Promise<OutboxDocument | null>{
        const lockExpiration = new Date(
            Date.now() - 2 * 60 * 1000
        )
        return this.model.findOneAndUpdate(
            {
                $or: [
                    {
                        status: OutboxStatus.PENDING
                    },
                    {
                        status: OutboxStatus.PROCESSING,
                        lockedAt: {
                            $lt: lockExpiration,
                        }
                    }
                ]
                
            },
            {
                $set: {
                    status: OutboxStatus.PROCESSING,
                    lockedAt: new Date()
                },
                $inc: {
                    attempts: 1
                },

            },
            {
                sort: {
                    createdAt:1
                },
                returnDocument:'after'
            }
        )
    }

    async markAsProcessed(
        id: Types.ObjectId
    ): Promise<void>{
        await this.model.updateOne(
            {
                _id:id,
                status: OutboxStatus.PROCESSING
            },
            {
                $set:{
                    status: OutboxStatus.PROCESSED,
                    processedAt: new Date()
                },
                $unset: {
                    lockedAt: 1
                }
            }
        )
    }

    async markAsFailed(
        id: Types.ObjectId
    ): Promise<void>{
        await this.model.updateOne(
            {
                _id:id,
                status: OutboxStatus.PROCESSING
            },
            {
                $set:{
                    status: OutboxStatus.FAILD,
                   
                },
                $unset: {
                    lockedAt: 1
                }
            }
        )
    }

}