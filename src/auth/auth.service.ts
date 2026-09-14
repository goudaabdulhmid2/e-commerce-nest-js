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
import { RefreshTokenReuseError } from './errors/refresh-token-reuse.error';
import { RefreshSessionResult } from './interfaces/refresh-session-result.interface';
import { session } from 'passport';
import { SessionResponseDto } from './dto/session-response.dto';

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

    

    async getSessions(
        userId: Types.ObjectId
    ): Promise<SessionResponseDto[]> {
        // Find all
        const sessions = 
            await this.sessionRepository.findActiveByUserId(userId);
        
        return AuthMapper.toSessionResponseList(
            sessions
        )
    }

    async logoutAll(
        userId: Types.ObjectId,
        response: Response
    ): Promise<void> {
        // Recoke every active session belongong to the user
        await this.sessionRepository.revokeAllByUserId(
            userId
        )

        // Clear cookie
        response.clearCookie(
            'refresh_token',
            {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                path: '/auth'
            }
        )
    }


    async logout(
        refreshToken: string,
        response: Response
    ): Promise<void>{
        // Always clear the refresh-token cookie from the client.
        response.clearCookie(
            'refresh_token',
            {
                httpOnly:true,
                secure: true,
                sameSite: 'strict',
                path: '/auth'
            }
        )

        // Nothing else is required when no refresh token exists.
        if(!refreshToken){
            return
        }

        // Hash the raw refresh token for database lookup.
        const tokenHash = 
            this.refreshTokenService.hashToken(
                refreshToken
            );
        
        // Find the refresh token record
        const storedToken = 
            await this.refreshTokenRepository.findByHash(
                tokenHash
            )

        // Nothing needs to be revoked when the token is unknown.
        if(!storedToken){
            return;
        }

        // Revoke the authentication session.
        await this.sessionRepository.revoke(
            storedToken.sessionId,
        );

        
    }

    async refresh(
        refreshToken: string,
        response: Response,
    ): Promise<LoginResponseDto> {
    // Reject the request when the refresh token is missing.
    if (!refreshToken) {
        throw new UnauthorizedException(
        'Refresh token is required',
        );
    }

    // Hash the raw refresh token for database lookup.
    const tokenHash =
        this.refreshTokenService.hashToken(
        refreshToken,
        );

    // Find the refresh token record by its hash.
    const storedToken =
        await this.refreshTokenRepository.findByHash(
        tokenHash,
        );

    // Reject completely unknown refresh tokens.
    if (!storedToken) {
        throw new UnauthorizedException(
        'Invalid refresh token',
        );
    }

    // Generate the identifier for the replacement token.
    const newTokenId =
        this.refreshTokenService.generateTokenId();

    // Generate the raw replacement refresh token.
    const newRefreshToken =
        this.refreshTokenService.generateToken();

    // Hash the replacement refresh token before storing it.
    const newTokenHash =
        this.refreshTokenService.hashToken(
        newRefreshToken,
        );

    // Calculate the expiration time of the replacement token.
    const expiresAt = new Date(
        Date.now() + this.REFRESH_TOKEN_EXPIRES,
    );

    let userId: Types.ObjectId;
    let sessionId: Types.ObjectId;

    try{

        // Rotate the refresh token and update the session atomically.
        const rotationResult =
            await this.transactionService.run(
            async (mongoSession) => {
                // Find the session inside the transaction.
                const session =
                await this.sessionRepository.findActiveSession(
                    storedToken.sessionId,
                    mongoSession,
                );
    
                // Reject the request when the session is no longer active.
                if (!session) {
                    throw new UnauthorizedException(
                        'Session is no longer active',
                    );
                }
    
                // Atomically consume the current refresh token.
                const consumedToken =
                await this.refreshTokenRepository.consumeToken(
                    storedToken.tokenId,
                    newTokenId,
                    mongoSession,
                );
    
                // Detect token reuse or a concurrent refresh request.
                if (!consumedToken) {
                throw new RefreshTokenReuseError(
                    session._id,
                );
                }
    
                // Store the replacement refresh token.
                await this.refreshTokenRepository.create(
                {
                    sessionId: session._id,
                    tokenId: newTokenId,
                    tokenHash: newTokenHash,
                    expiresAt,
                },
                    mongoSession,
                );
    
                // Update the session activity timestamp.
                await this.sessionRepository.updateLastUsed(
                    session._id,
                    mongoSession,
                );
    
                // Return the session information after the transaction succeeds.
                return {
                    userId: session.userId,
                    sessionId: session._id
                };
            },
            );

        userId = rotationResult.userId;
        sessionId = rotationResult.sessionId
    }catch(error){
        // Revoke the entire session when refresh-token reuse is detected
        if(error instanceof RefreshTokenReuseError){
            // Revoke the authentication session 
            // Revoke the authentication session.
            await this.sessionRepository.revoke(
                error.sessionId,
                
            );
            // Reject the reused refresh token.
            throw new UnauthorizedException(
            'Refresh token reuse detected',
            );
        }

        // Re-throw all unrelated errors
        throw error;
    }

    // Load the current user after the transaction has committed.
    const user =
        await this.userService.findUserById(
            userId,
        );

    // Reject the refresh when the user no longer exists or was deleted.
    if (!user || user.isDeleted) {
        throw new UnauthorizedException(
        'User account is no longer active',
        );
    }

    // Build the access token payload using the user's current role.
    const payload = {
        sub: user._id.toString(),
        role: user.role,
        sid: sessionId
    };

    // Generate a new short-lived access token.
    const accessToken =
        await this.jwtService.signAsync(payload);

    // Replace the old refresh token cookie with the new token.
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

        // Create a new refresh session and its first refresh token.
        const refreshSession = 
        await this.createRefreshSession(user._id)

        // Create JWT payload
        const payload = {
            sub: user._id.toString(),
            role: user.role,
            sid: refreshSession.sessionId.toString()
        }
        
        // Genrate a signed access token.
        const accessToken = await this.jwtService.signAsync(
            payload
        )

        // Store the refresh token inside a secure HTTP-only cookie.
        response.cookie(
            'refresh_token',
            refreshSession.refreshToken,
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
    ): Promise<RefreshSessionResult> {
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

        // Create the session and its first refresh token atomically.
        const sessionId = 
            await this.transactionService.run(
                async(mongoSession) => {
                    
                    // Create a new authentication session for this login.
                    const session = await this.sessionRepository.create({
                        userId,
                        expiresAt,
                    },
                    mongoSession
                    );

                    // Create the first refresh token belonging to this session.
                    await this.refreshTokenRepository.create({
                        sessionId: session._id,
                        tokenId,
                        tokenHash,
                        expiresAt,
                    },
                    mongoSession
                    );

                    return session._id

                }
            );

        // Return the raw refresh token to the login flow.
        return {
            sessionId,
            refreshToken: rawRefreshToken

        };
    }




    


        
    
}


