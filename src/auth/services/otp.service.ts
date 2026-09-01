import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OtpRepository } from "../repositories/otp.repository";
import { PasswordService } from "src/common/security/password/password.service";
import { randomInt } from "crypto";
import { Types } from "mongoose";
import { OtpTypes } from "../enums/otpType.enum";



@Injectable()
export class OtpService{
    private readonly MAX_ATTEMPTS: number;
    private readonly OTP_EXPIRATION_MINUTES: number;
    private readonly OTP_LENGTH: number;
    constructor(
        private readonly configService: ConfigService,
        private readonly otpRepository: OtpRepository,
        private readonly passwordService: PasswordService
    ) {
        this.MAX_ATTEMPTS = this.configService.get<number>('MAX_ATTEMPTS', 5);
        this.OTP_EXPIRATION_MINUTES= this.configService.get<number>('OTP_EXPIRATION_MINUTES', 5);
        this.OTP_LENGTH= this.configService.get<number>('OTP_LENGTH' ,6);    
    }



    async verifyOtp(
        userId: Types.ObjectId,
        otp: string,
        otpType: OtpTypes
    ): Promise<void> {
        // Find an unused and non-expired OTP for this user and OTP type.
        const otpDocument =
            await this.otpRepository.findActiveOtp(
                userId,
                otpType,
            )
        
        if(!otpDocument){
            throw new BadRequestException(
                'Invalid or expored OTP'
            )
        }

        // Reject the OTP if the maximum number of verification attempts
        // has already been reached.
        if(otpDocument.attempts >= this.MAX_ATTEMPTS){
            throw new BadRequestException(
                'Maximum OTP attempts exceeded'
            )
        }

        // Compare the plaintext OTP provided by the user
        // with the hashed OTP stored in the database.
        const isValid =
            await this.passwordService.compare(
                otp,
                otpDocument.otp
            );
        
        if(!isValid){
            // Increase the number of failed verification attempts.
            await this.otpRepository.incrementAttempts(otpDocument._id)

            throw new BadRequestException(
                'Invalid or expired OTP',
            )
        }

        await this.otpRepository.markAsUsed(
            otpDocument._id
        )


    }

    async createOtp(
        userId: Types.ObjectId,
        otpType: OtpTypes
    ) {

        const otp = this.generateOtp();

        const hashedOtp = 
            await this.passwordService.hash(otp);

        const expiresAt = new Date(
            Date.now() + 
            (this.OTP_EXPIRATION_MINUTES) * 60 * 1000
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
            this.OTP_LENGTH,
             '0' 
        )

    }
}