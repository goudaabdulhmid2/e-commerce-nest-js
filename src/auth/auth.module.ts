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
import { EncryptionModule } from 'src/common/security/encryption/encryption.module';
import { OtpService } from './services/otp.service';
import { EmailModule } from 'src/common/email/email.module';
import { EmailVerificationListener } from './listeners/email-verification.listener';
import { QueueModule } from 'src/common/queue/queue.module';

@Module({
    imports:[
        PasswordModule,
        EncryptionModule,
        UsersModule,
        EmailModule,
        QueueModule,
        // Register Schema in Module
        MongooseModule.forFeature([
            { name:RevokedToken.name, schema: RevokedTokenSchema },
            {name: Otp.name, schema: OtpSchema}
        ]),
    ],
    providers:[
        RevokedTokenRepository,
        OtpRepository,
        AuthService,
        OtpService,
        EmailVerificationListener,
    ],
    controllers: [AuthController]
})
export class AuthModule {}
