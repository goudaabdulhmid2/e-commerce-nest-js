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
import { OutboxModule } from 'src/common/outbox/outbox.module';
import { DatabaseModule } from 'src/common/database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { Session, SessionSchema } from './schemas/session.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { SessionRepository } from './repositories/session.repository';
import { RefreshTokenService } from './services/refresh-token.service';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

@Module({
    imports:[
        PasswordModule,
        EncryptionModule,
        UsersModule,
        EmailModule,
        QueueModule,
        OutboxModule,
        DatabaseModule,
        // Register Schema in Module
        MongooseModule.forFeature([
            { name:RevokedToken.name, schema: RevokedTokenSchema },
            {name: Otp.name, schema: OtpSchema},
            {name: Session.name, schema: SessionSchema},
            {name: RefreshToken.name, schema: RefreshTokenSchema}
        ]),

        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET',),
                signOptions: {
                    expiresIn: configService.getOrThrow<string>(
                     'JWT_ACCESS_EXPIRES_IN',
                    ) as StringValue,
                }
            })
        })
    ],
    providers:[
        RevokedTokenRepository,
        OtpRepository,
        AuthService,
        OtpService,
        EmailVerificationListener,
        JwtStrategy,
        JwtAuthGuard,
        AdminGuard,
        SessionRepository,
        RefreshTokenRepository,
        RefreshTokenService,
    ],
    controllers: [AuthController],
    exports:[
        JwtModule,
        SessionRepository,
        RefreshTokenRepository,
        RefreshTokenService
    ]
})
export class AuthModule {}
