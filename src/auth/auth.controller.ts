import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { Throttle } from '@nestjs/throttler';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDTO } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

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

}
