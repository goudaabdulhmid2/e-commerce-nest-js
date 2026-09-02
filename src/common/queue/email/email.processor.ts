import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { Types } from "mongoose";


import { EmailService } from "src/common/email/email.service";
import { ProcessedEventType } from "src/common/idempotency/enums/processed-event-type.enum";
import { ProcessedEventRepository } from "src/common/idempotency/repositories/processed-event.repository";




@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(
        EmailProcessor.name,
      );

    constructor(
        private readonly emailService: EmailService,
        private readonly processedEventRepository: ProcessedEventRepository
    ){
        super()
    }

    async process(
        job: Job
    ):Promise<void> {
        console.log('[WORKER] Job received:', {
            id: job.id,
            name: job.name,
            data: job.data,
        });

        if (job.name === 'verification-email') {

            const {
                email,
                otp,
                outboxEventId
            } = job.data as {
                email: string,
                otp: string,
                outboxEventId: string
            }

            

            // Check whether this event was already processed.
            const alreadyProcessed = 
                await this.processedEventRepository
                .existsByEvntId(new Types.ObjectId(outboxEventId));

            if (alreadyProcessed){
                this.logger.log(
                    `Event ${outboxEventId} already processed. Skipping.`,
                )

                return;
            }



            // Execute the actual side effect
            this.logger.log('[WORKER] Calling EmailService...');
            
            await this.emailService.sendOtp(
                email,
                otp,
            );

            try{
                // Record the event after the email was sent successfully.
                await this.processedEventRepository
                .createProcessedEvent(
                    new Types.ObjectId(outboxEventId),
                    ProcessedEventType.EMAIL_VERIFICATION
                );

            }catch(error){
                // Another worker may have recorded the same event.
                if (
                    this.isDplicateKeyError(error)
                ){
                    this.logger.warn(
                         `Event ${outboxEventId} was already recorded by another worker.`
                    );

                    return;
                }

                throw error

            }


            this.logger.log(
                    `Event ${outboxEventId} processed successfully`,
                );

            return;
        }

        }

        private isDplicateKeyError(
            error: unknown
        ): boolean {
            return (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 11000
            )
        }
}