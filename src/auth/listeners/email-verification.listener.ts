import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Types } from "mongoose";
import { EmailService } from "src/common/email/email.service";
import { EmailVerificationRequestEvent } from "../events/email-verification-requested.event";


@Injectable()
export class EmailVerificationListener {
    constructor(
        private readonly emailService: EmailService
    ){}

    @OnEvent('auth.email-verification-requested')
    async handle(
        event: EmailVerificationRequestEvent,
    ): Promise<void> {
        await this.emailService.sendOtp(
            event.email,
            event.otp
        )
    }
}