import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordService } from 'src/common/security/password/password.service';
import { OtpTypes } from './enums/otpType.enum';
import { UsersService } from 'src/users/users.service';
import { SignupDto } from './dto/signup.dto';
import { CreateUserData } from 'src/users/types/create-user.type';
import { AuthMapper } from './mappers/auth.mapper';
import { EncryptionService } from 'src/common/security/encryption/encryption.service';
import { OtpService } from './services/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { TransactionService } from 'src/common/database/transaction.service';
import { OutboxRepository } from 'src/common/outbox/repositories/outbox.repository';
import { LoginDTO } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenService } from './services/refresh-token.service';
import { SessionRepository } from './repositories/session.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { Types } from 'mongoose';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    private readonly REFRESH_TOKEN_EXPIRES;

    constructor(
        private readonly passwordService: PasswordService,
        private readonly userService: UsersService,
        private readonly encryptionService: EncryptionService,
        private readonly otpService: OtpService,
        // private readonly eventEmitter: EventEmitter2,
        private readonly transactionService: TransactionService,
        private readonly outboxRepository: OutboxRepository,
        private readonly jwtService: JwtService,
        private readonly refreshTokenService: RefreshTokenService,
        private readonly sessionRepository: SessionRepository,
        private readonly refreshTokenRepository: RefreshTokenRepository,
        private readonly configService: ConfigService
    ) {
        this.REFRESH_TOKEN_EXPIRES = this.configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRES')
    }

    async refresh(
        refreshToken: string,
        response: Response
    ): Promise<LoginResponseDto>{
       // Reject the request when no refresh token was provided.
       if(!refreshToken){
        throw new UnauthorizedException(
            'Refresh token is required'
        )
       }

       // Hash the raw refresh token so it can be safely looked up in the database.
       const tokenHash = 
        this.refreshTokenService.hashToken(refreshToken)

        // Find the refresh token record using its hash.
        const storedToken = 
            await this.refreshTokenRepository.findByHash(tokenHash)

        // Reject the request when the refresh token does not exist.
        if(!storedToken){
            throw new UnauthorizedException(
                'Invalid refresh token'
            );
        }

        // Find the auth session associated with the refresh token
        const session =
            await this.sessionRepository.findActiveSession(
                storedToken.sessionId
            )
        
        // Reject the request when the session is revoked or expired.
        if(!session){
            throw new UnauthorizedException(
                'Session is no longer active'
            )
        }

        // Generate the identifier for the new refresh token.
        const newTokenId = 
            this.refreshTokenService.generateTokenId()
        
        // Atomically consume the current refresh token.
        const consumedToken = 
            await this.refreshTokenRepository.consumeToken(
                storedToken.tokenId,
                newTokenId
            )
        
        // Detect concurrent refresh requests using the same token.
        if(!consumedToken){
            // Revoke the entire session because token reuse was detected.
            await this.sessionRepository.revoke(
                session._id
            );

            // Reject the request because the token was already consumed.
            throw new UnauthorizedException(
             'Refresh token reuse detected',
            );
        }

        // Generate the new raw refresh token.
        const newRefreshToken =
            this.refreshTokenService.generateToken();

        // Hash
        const newTokenHash = 
            this.refreshTokenService.hashToken(newRefreshToken);

        // Calculate the expiration time of the new refresh token.
        const expiresAt = new Date(
            Date.now() + this.REFRESH_TOKEN_EXPIRES
        )

        // store the new rfresh token for the same session
        await this.refreshTokenRepository.create({
            sessionId: session._id,
            tokenId: newTokenId,
            tokenHash: newTokenHash,
            expiresAt,
        });

        // Update the session activity timestamp
        await this.sessionRepository.updateLastUsed(
            session._id
        )

        const user =
            await this.userService.findUserById(
                session.userId,
            );

        if (!user || user.isDeleted) {
            // Reject the refresh request when the user no longer exists or was deleted.
            throw new UnauthorizedException(
                'User account is no longer active',
            );
        }

        // Build the access token payload
        const patload = {
            sub: user._id.toString(),
            role:user.role
        }

        // Generate a new short-lived access token.
        const accessToken = 
            await this.jwtService.signAsync(patload);

        // Replace the refresh token stored in the HTTP-only cookie.
        response.cookie(
            'refresh_token',
            newRefreshToken,
            {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            path: '/auth',
            maxAge: this.REFRESH_TOKEN_EXPIRES,
            },
    );

        // Return the new access token to the client.
        return AuthMapper.toLoginResponse(
            accessToken,
        );

    }

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

       

        return AuthMapper.toSignupResponse(result.user);
    }


    async login(
        loginDto: LoginDTO,
        response: Response
    ): Promise<LoginResponseDto>{

        // Validate
        const user = await this.validateLogin(loginDto);

        // Create JWT payload
        const payload = {
            sub: user._id.toString(),
            role: user.role
        }
        
        // Genrate a signed access token.
        const accessToken = await this.jwtService.signAsync(
            payload
        )

        // Create a new refresh session and its first refresh token.
        const refreshToken = 
            await this.createRefreshSession(user._id)

        // Store the refresh token inside a secure HTTP-only cookie.
        response.cookie(
            'refresh_token',
            refreshToken,
            {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/auth',
                maxAge: this.REFRESH_TOKEN_EXPIRES
            }
        )
        
        
        return AuthMapper.toLoginResponse(accessToken)
    }



    private async validateLogin(
        loginDto: LoginDTO
    ){
        // Find user
        const user =
            await this.userService.findByEmailWithPassword(
                loginDto.email
            )
        
        // Reject the login if the user dose not exist
        if(!user){
            throw new UnauthorizedException(
                'Invalid email or password'
            )
        }

        // verify password
        const isPasswordValid = 
            await this.passwordService.compare(
                loginDto.password, 
                user.password
            );
        
        // Reject if not correct
        if(!isPasswordValid){
            throw new UnauthorizedException(
                'Invalid email or password'
            )
        }

        // Prevent unverified users from obtainig a normal authenticated session
        if(!user.isEmailVerified){
            throw new ForbiddenException(
                'Email verification is required'
            )
        }

        return user;
    }


    private async createRefreshSession(
        userId: Types.ObjectId,
    ): Promise<string> {
        // Generate the raw refresh token that will be sent to the client.
        const rawRefreshToken =
            this.refreshTokenService.generateToken();

        // Generate a unique identifier for this refresh token.
        const tokenId =
            this.refreshTokenService.generateTokenId();

        // Hash the refresh token before storing it in the database.
        const tokenHash =
            this.refreshTokenService.hashToken(
            rawRefreshToken,
            );

        // Define the lifetime of the refresh session.
        const expiresAt = new Date(
            Date.now() + this.REFRESH_TOKEN_EXPIRES,
        );

        // Create a new authentication session for this login.
        const session = await this.sessionRepository.create({
            userId,
            expiresAt,
        });

        // Create the first refresh token belonging to this session.
        await this.refreshTokenRepository.create({
            sessionId: session._id,
            tokenId,
            tokenHash,
            expiresAt,
        });

        // Return the raw refresh token to the login flow.
        return rawRefreshToken;
}

    


        
    
}


