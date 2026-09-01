import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PasswordService } from 'src/common/security/password/password.service';
import { OtpTypes } from './enums/otpType.enum';
import { UsersService } from 'src/users/users.service';
import { SignupDto } from './dto/signup.dto';
import { CreateUserData } from 'src/users/types/create-user.type';
import { AuthMapper } from './mappers/auth.mapper';
import { EncryptionService } from 'src/common/security/encryption/encryption.service';
import { OtpService } from './services/otp.service';
import { EmailService } from 'src/common/email/email.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmailVerificationRequestEvent } from './events/email-verification-requested.event';
import { EmailQueueService } from 'src/common/queue/email/email-queue.service';
import { TransactionService } from 'src/common/database/transaction.service';
import { OutboxRepository } from 'src/common/outbox/repositories/outbox.repository';

@Injectable()
export class AuthService {

    constructor(
        private readonly passwordService: PasswordService,
        private readonly userService: UsersService,
        private readonly encryptionService: EncryptionService,
        private readonly otpService: OtpService,
        // private readonly eventEmitter: EventEmitter2,
        private readonly emailQueueService: EmailQueueService,
        private readonly transactionService: TransactionService,
        private readonly outboxRepository: OutboxRepository
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

        if (
             verifyOtpDto.otpType ===
             OtpTypes.EMAIL_VERIFICATION
        ) {
                const updatedUser =
                    await this.userService.verifyEmail(user._id);

                return AuthMapper.toSignupResponse(updatedUser!);
            }

    }

    async signup(signupDto: SignupDto) {

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

        const result = 
            await this.transactionService.run(
                async(session) => {
                    // Create the user inside the transaction.
                    const user =
                        await this.userService.create(
                            userData,
                            session
                        );

                    // Create the verification OTP inside
                    // the same transaction.
                    const {otp} = 
                        await this.otpService.createOtp(
                            user._id, 
                            OtpTypes.EMAIL_VERIFICATION,
                            session
                        );


                    // Store the email event in the Outbox
                    // inside the same MongoDB transaction.
                    await this.outboxRepository.create(
                        {
                            type: 'EMAIL_VERIFICATION',
                            payload: {
                                email: user.email,
                                otp
                            },
                        },
                        session
                    );

                    return {
                        user,
                        otp
                    }
                    
                }
            )



        // Publish an event requesting an email verification message.
        // The listener will handle sending the actual email.
        // this.eventEmitter.emit(
        //     'auth.email-verification-requested',
        //     new EmailVerificationRequestEvent(
        //         user._id,
        //         user.email,
        //         otp
        //     )
        // )

       // The MongoDB transaction has already committed here.
       // Only now should we publish/send the queue job.
        await this.emailQueueService.addVerificationEmail(
            result.user.email,
            result.otp
        )

        return AuthMapper.toSignupResponse(result.user);
    }

    


        
    
}


