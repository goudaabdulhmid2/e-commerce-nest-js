import { Injectable, Logger } from "@nestjs/common";
import { OutboxRepository } from "../repositories/outbox.repository";
import { EmailQueueService } from "src/common/queue/email/email-queue.service";
import { Cron } from "@nestjs/schedule";


@Injectable()
export class OutboxPublisherService {
    private readonly logger = 
        new Logger(OutboxPublisherService.name)
    
    constructor(
        private readonly outboxRepository: OutboxRepository,
        private readonly emailQueueService: EmailQueueService
    ){}

    // Every 5 seconds => check Outbox => find PENDING event => publish to BullMQ
    @Cron('*/5 * * * * *')
    async publishPendingEvents(): Promise<void> {
        const event =
           await this.outboxRepository.claimPendingEvent();

        if(!event){
            return;
        }

        try{
            this.logger.log(
                `Publishing outbox event ${event._id}`
            )

            if(event.type === 'EMAIL_VERIFICATION'){
                const {
                    email,
                    otp,
                } = event.payload as {
                    email: string,
                    otp: string
                };

                await this.emailQueueService
                    .addVerificationEmail(
                        email,
                        otp
                    )
                await this.outboxRepository.markAsProcessed(
                    event._id
                )

                this.logger.log(
                `Outbox event ${event._id} processed`,
                     );
            }
        }catch(error){
            this.logger.error(
            `Failed to publish outbox event ${event._id}`,
            error,
        );

        await this.outboxRepository.markAsFailed(
            event._id,
        );

        throw error;
        }
    }
}