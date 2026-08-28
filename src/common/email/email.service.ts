import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    async sendOtp(email: string,
        otp: string,
    ): Promise<void> {
        
    }
}
