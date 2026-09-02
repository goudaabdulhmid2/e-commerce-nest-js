import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailModule } from "src/common/email/email.module";
import { IdIdempotencyModule } from "src/common/idempotency/idempotency.module";
import { EmailProcessor } from "src/common/queue/email/email.processor";
import { envValidationSchema } from "src/config/env.validtion";



@Module({
    imports: [
        EmailModule,
        IdIdempotencyModule,
        
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
            validationSchema: envValidationSchema,

            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
        },
        }),
        

        BullModule.forRootAsync({
            imports:[ConfigModule],
            inject:[ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                }
            })
            }),

        BullModule.registerQueue({
                name:'email'
            })
    ],
    providers: [
        EmailProcessor
    ]
})
export class WorkerModule {}