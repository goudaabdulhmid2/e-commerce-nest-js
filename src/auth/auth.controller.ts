import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { SignupResponseDto } from './dto/signup-response.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

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

}
