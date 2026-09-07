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


    // Claim the next available Outbox event and mark it as PROCESSING atomically.
    async claimPendingEvent(): Promise<OutboxDocument | null> {

        // Get the current time to check whether a retry is due.
        const now = new Date();

        // Calculate the time before which a PROCESSING lock is considered expired.
        const lockExpiration = new Date(
            Date.now() - 2 * 60 * 1000,
        );

        // Atomically find and update one eligible Outbox event.
        return this.model.findOneAndUpdate(

            // Define the conditions that make an event eligible to be claimed.
            {
            $or: [

                // Case 1: The event is PENDING and its retry time has arrived.
                {
                // Only consider events that are currently waiting to be published.
                status: OutboxStatus.PENDING,

                // The event can be claimed if there is no retry time
                // or the scheduled retry time has already arrived.
                $or: [

                    // Allow newly created events that do not have a retry time.
                    { nextAttemptAt: { $exists: false } },

                    // Allow retrying events whose scheduled retry time has arrived.
                    { nextAttemptAt: { $lte: now } },
                ],
                },

                // Case 2: The event is PROCESSING but its lock has expired.
                {
                // Only consider events that are currently being processed.
                status: OutboxStatus.PROCESSING,

                // Reclaim the event if its previous publisher lock is older than 2 minutes.
                lockedAt: { $lt: lockExpiration },
                },
            ],
            },

            // Define the changes that should be applied when claiming the event.
            {
            // Mark the event as currently being processed.
            $set: {

                // Change the event status from PENDING to PROCESSING.
                // Or refresh the status when reclaiming an expired PROCESSING event.
                status: OutboxStatus.PROCESSING,

                // Record when this publisher claimed the event.
                lockedAt: now,
            },

            // Increase the number of publishing attempts by one.
            $inc: {
                attempts: 1,
            },
            },

            // Configure how MongoDB should select and return the event.
            {
            // If multiple events are available, claim the oldest one first.
            sort: { createdAt: 1 },

            // Return the document after the update has been applied.
            returnDocument: 'after',
            },
        );
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
                    lockedAt: 1,
                    nextAttemptAt: 1,
                    lastError: 1,
                }
            }
        )
    }

    async markAsPending(
        id: Types.ObjectId,
        nextAttemptAt: Date,
        lastError?: string
    ): Promise<void> {
        await this.model.updateOne(
            {
                _id:id,
                status: OutboxStatus.PROCESSING
            },
            {
                $set: {
                    status: OutboxStatus.PENDING,
                    nextAttemptAt,
                    ...(lastError? {lastError} : {})
                },
                $unset: {
                    lockedAt: 1
                }
            }
        )
    }



}