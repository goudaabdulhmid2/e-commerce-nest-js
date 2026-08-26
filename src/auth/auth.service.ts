import { Injectable } from '@nestjs/common';
import { OtpRepository } from './repositories/otp.repository';
import { PasswordService } from 'src/common/security/password/password.service';
import { OtpTypes } from './enums/otpType.enum';
import { Types } from 'mongoose';
import { OtpDocument } from './schemas/otp.schema/otp.schema';

@Injectable()
export class AuthService {

    constructor(private readonly otpRepository: OtpRepository, private readonly passwordService: PasswordService) {}

    async createOtp(userId: Types.ObjectId, otp: string, otpType: OtpTypes, expireTime?:Date ) : Promise<OtpDocument | null> {
        const hashedOtp = await this.passwordService.hash(otp);
        const data = {
            userId,
            otp: hashedOtp,
            otpType,
            expireTime: expireTime || new Date(Date.now() + 10* 60 * 1000) // Default to 5 minutes from now
        };
        return this.otpRepository.create(data);
    }
        
    
}


