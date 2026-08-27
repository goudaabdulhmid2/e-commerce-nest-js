import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevokedToken, RevokedTokenSchema } from './schemas/revoked-token.schema/revoked-token.schema';
import { Otp, OtpSchema } from './schemas/otp.schema/otp.schema';
import { RevokedTokenRepository } from './repositories/revoke-token.repository';
import { OtpRepository } from './repositories/otp.repository';
import { PasswordModule } from 'src/common/security/password/password.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
    imports:[
        PasswordModule,
        UsersModule,
        // Register Schema in Module
        MongooseModule.forFeature([
            { name:RevokedToken.name, schema: RevokedTokenSchema },
            {name: Otp.name, schema: OtpSchema}
        ]),
    ],
    providers:[
        RevokedTokenRepository,
        OtpRepository,
        AuthService
    ],
    controllers: [AuthController]
})
export class AuthModule {}
