import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Queue } from "bullmq";




@Injectable()
export class EmailQueueService{
    private readonly logger = new Logger(
        EmailQueueService.name,
      );

    constructor(
        @InjectQueue('email')
        private readonly emailQueue: Queue
    ){}

    async addVerificationEmail(
        email: string,
        otp: string,
        outboxEventId: string
    ): Promise<void> {

        this.logger.log(
            `Adding email job for ${email}`,
        );

        // Add a verification email job to the email queue.
        await this.emailQueue.add(
            'verification-email',
            {
                email,
                otp
            },
            {
                // Use the Outbox Event ID as the unique BullMQ Job ID.
                jobId: `outbox-${outboxEventId}`,

              // Retry the job up to 3 times if processing fails.
              attempts: 3,
              // Wait before retrying and increase the delay
              // after each failed attempt.
              backoff: {
                type:'exponential',
                delay: 5_000
              },
                // Remove successful jobs from Redis
                // after they have been processed.
                removeOnComplete: true,

                // Keep failed jobs for debugging/monitoring.
                removeOnFail: false
                

  
            }
        )

         this.logger.log(
            `Email job added for ${email}`,
        );
    }
}