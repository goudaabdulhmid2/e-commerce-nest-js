import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
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
import { OtpService } from './services/otp.service';
import { EmailService } from 'src/common/email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {

    constructor(
        private readonly passwordService: PasswordService,
        private readonly userService: UsersService,
        private readonly encryptionService: EncryptionService,
        private readonly otpService: OtpService,
        private readonly emailService: EmailService
    ) {}

    async verifyOtp(
        verifyOtpDto: VerifyOtpDto
    ) {
        const user =
            await this.userService.findByEmail(
                verifyOtpDto.email
            );
        
        if(!user){
            throw new BadRequestException(
                'Invalid OTP'
            )
        }

        await this.otpService.verifyOtp(
            user._id,
            verifyOtpDto.otp,
            verifyOtpDto.otpType,
        );

        const updatedUser= await this.userService.verifyEmail(
            user._id
        )

        return AuthMapper.toSignupResponse(updatedUser!);
    }

    async signup(signupDto: SignupDto){
        const emailExists = 
            await this.userService.existsByEmail(
            signupDto.email
            );


        // Check if the email is already registered.
        // This prevents unnecessary database insertion attempts
        // in the normal case.
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

        // Genrate and store the email verification OTP
        const {otp} = await this.otpService.createOtp(
            user._id, 
            OtpTypes.EMAIL_VERIFICATION
        );

        // send the otp
        await this.emailService.sendOtp(
            user.email,
            otp
        );

        return AuthMapper.toSignupResponse(user);
    }

    


        
    
}


