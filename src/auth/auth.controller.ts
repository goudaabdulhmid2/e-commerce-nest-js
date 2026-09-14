import { Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { Throttle } from '@nestjs/throttler';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDTO } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Types } from 'mongoose';
import { SessionResponseDto } from './dto/session-response.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Delete('sessions/:sessionId')
    @UseGuards(JwtAuthGuard)
    async revokeSession(
        @Param('sessionId', ParseObjectIdPipe)
        sessionId: Types.ObjectId,
        @Req() request: Request
    ): Promise<void> {
        const user = request.user as {
            userId: string,

        };

        // Revoke the requested session when it belongs to the authenticated user.
        await this.authService.revokeSession(
            sessionId,
            new Types.ObjectId(user.userId),
        );


    }

    @Get('sessions')
    @UseGuards(JwtAuthGuard)
    async getSessions(
    @Req() request: Request,
    ): Promise<SessionResponseDto[]> {
    // Read the authenticated user ID from the JWT payload.
    const user = request.user as {
        userId: string;
    };

    // Return all active sessions belonging to the authenticated user.
    return this.authService.getSessions(
        new Types.ObjectId(user.userId),
    );
}

    @Post('logout-all')
    @UseGuards(JwtAuthGuard)
    async logoutAll(
        @Req() request: Request,
        @Res({passthrough: true})
        response: Response
    ): Promise<void>{
        // Red authenticated user
        const user = request.user as {
            userId: string
        }

        // Revoke all sessions 
        await this.authService.logoutAll(
            new Types.ObjectId(
                user.userId
            ),
            response
        )
    }

    @Post('logout')
    async logout(
        @Req() request: Request,
        @Res({passthrough: true}) response: Response
    ): Promise<void>{
        // Read the refresh token from the HTTP-only cookie.
        const refreshToken = 
            request.cookies?.refresh_token;

        // Revoke the refresh session and clear the cookie
        await this.authService.logout(
            refreshToken,
            response
        )
    }

    @Post('verify-otp')
    @Throttle({
        default:{
            ttl: 60_000,
            limit: 5
        }
    })
    verifyOtp(
        @Body() verifyOtpDto: VerifyOtpDto
    ){
        return this.authService.verifyOtp(verifyOtpDto)
    }

    @Post('signup')
    @Throttle({
        default: {
            ttl: 60_000,
            limit: 10
        }
    })
    signup(@Body() signupDto: SignupDto): Promise<SignupResponseDto>{
        return this.authService.signup(signupDto)
    }

    @Post('login')
    async login(
        @Body() loginDto: LoginDTO,
        @Res({passthrough: true})
        response: Response
    ): Promise<LoginResponseDto> {
        return this.authService.login(loginDto, response)
    }

    @Post('refresh')
    async refresh(
        @Req() request: Request,
        @Res({passthrough: true})
        response: Response
    ): Promise<LoginResponseDto>{
        // Read the refresh
        const refreshToken = 
            request.cookies?.refresh_token;

        
        // Rotate the refresh token and issue a new access token
        return this.authService.refresh(
            refreshToken, response
        )
    }

}
