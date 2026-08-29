import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";


import { EmailService } from "src/common/email/email.service";




@Processor('email')
@Injectable()
export class EmailProcessor extends WorkerHost {
    constructor(
        private readonly emailService: EmailService
    ){
        super()
    }

    async process(job: Job): Promise<void> {
        // Handle verification email jobs.
        if(job.name === 'verification-email'){
            await this.emailService.sendOtp(
                job.data.email,
                job.data.otp
            );
            
            return;
        }

        // Reject unknown job types.
        throw new Error(
            `Unknown email job: ${job.name}`,
        )
    }
}