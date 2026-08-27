import { ConflictException, Injectable } from '@nestjs/common';
import { OtpRepository } from './repositories/otp.repository';
import { PasswordService } from 'src/common/security/password/password.service';
import { OtpTypes } from './enums/otpType.enum';
import { Types } from 'mongoose';
import { OtpDocument } from './schemas/otp.schema/otp.schema';
import { UsersService } from 'src/users/users.service';
import { SignupDto } from './dto/signup.dto';
import { CreateUserData } from 'src/users/types/create-user.type';
import { AuthMapper } from './mappers/auth.mapper';
import { EncryptionService } from 'src/common/security/encryption/encryption.service';

@Injectable()
export class AuthService {

    constructor(
        private readonly otpRepository: OtpRepository, 
        private readonly passwordService: PasswordService,
        private readonly userService: UsersService,
        private readonly encryptionService: EncryptionService
    ) {}

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


    async signup(signupDto: SignupDto){
        const emailExists = 
            await this.userService.existsByEmail(
            signupDto.email
            );

        if(emailExists){
            throw new ConflictException('Email already exists')
        }

        const hashedPassword =
            await this.passwordService.hash(signupDto.password);

        const encryptedPhone = 
            this.encryptionService.encrypt(signupDto.phone)
        
        const userData: CreateUserData = {
            firstName: signupDto.firstName,
            lastName: signupDto.lastName,
            email: signupDto.email,
            password: hashedPassword,
            phone: encryptedPhone,
            gender: signupDto.gender,
            dateOfBirth: signupDto.dateOfBirth,
        };


        const user = await this.userService.create(userData);

        return AuthMapper.toSignupResponse(user);
    }
    


        
    
}


