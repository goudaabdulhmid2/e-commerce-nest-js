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
            {name: Otp.name, schema: OtpSchema}
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
        JwtStrategy
    ],
    controllers: [AuthController],
    exports:[
        JwtModule
    ]
})
export class AuthModule {}
