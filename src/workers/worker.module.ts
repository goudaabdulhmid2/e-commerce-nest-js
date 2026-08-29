import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailModule } from "src/common/email/email.module";
import { EmailProcessor } from "src/common/queue/email/email.processor";



@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env'
        }),
        
        EmailModule,

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