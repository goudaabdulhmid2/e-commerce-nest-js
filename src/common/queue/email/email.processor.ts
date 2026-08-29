import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";


import { EmailService } from "src/common/email/email.service";




@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
    private readonly logger = new Logger(
        EmailProcessor.name,
      );

    constructor(
        private readonly emailService: EmailService,
    ){
        super()
    }
    async process(job: Job): Promise<void> {
        console.log('[WORKER] Job received:', {
            id: job.id,
            name: job.name,
            data: job.data,
        });

        if (job.name === 'verification-email') {
            this.logger.log('[WORKER] Calling EmailService...');

            await this.emailService.sendOtp(
            job.data.email,
            job.data.otp,
            );

            this.logger.log('[WORKER] Email sent successfully');

            return;
        }

        throw new Error(
            `Unknown email job: ${job.name}`,
        );
        }
}