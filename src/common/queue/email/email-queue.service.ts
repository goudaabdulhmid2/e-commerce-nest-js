import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";




@Injectable()
export class EmailQueueService{
    constructor(
        @InjectQueue('email')
        private readonly emailQueue: Queue
    ){}

    async addVerificationEmail(
        email: string,
        otp: string,
    ): Promise<void> {
        // Add a verification email job to the email queue.
        await this.emailQueue.add(
            'verification-email',
            {
                email,
                otp
            },
            {
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
    }
}