import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RevokedToken, RevokedTokenSchema } from './schemas/revoked-token.schema/revoked-token.schema';
import { Otp, OtpSchema } from './schemas/otp.schema/otp.schema';

@Module({
    imports:[
        // Register Schema in Module
        MongooseModule.forFeature([
            { name:RevokedToken.name, schema: RevokedTokenSchema },
            {name: Otp.name, schema: OtpSchema}
        ])
    ]
})
export class AuthModule {}
