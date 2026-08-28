import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OtpRepository } from "../repositories/otp.repository";
import { PasswordService } from "src/common/security/password/password.service";
import { randomInt } from "crypto";
import { Types } from "mongoose";
import { OtpTypes } from "../enums/otpType.enum";



@Injectable()
export class OtpService{
    constructor(
        private readonly configService: ConfigService,
        private readonly otpRepository: OtpRepository,
        private readonly passwordService: PasswordService
    ) {}

    async createOtp(
        userId: Types.ObjectId,
        otpType: OtpTypes
    ) {

        const otp = this.generateOtp();

        const hashedOtp = 
            await this.passwordService.hash(otp);

        const expiresAt = new Date(
            Date.now() + 
            (this.configService.get<number>('OTP_EXPIRATION_MINUTES') || 5) * 60 * 1000
        )

        await this.otpRepository.create({
            userId,
            otp: hashedOtp,
            otpType,
            expiresAt
        })

        return {
            otp,
        }
    }
    

    private generateOtp(): string {
        const number = randomInt(0, 1_000_000);


        return number.toString().padStart(
            this.configService.get<number>('OTP_LENGTH') || 6,
             '0' 
        )

    }
}