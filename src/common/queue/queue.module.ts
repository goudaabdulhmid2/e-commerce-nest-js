import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EmailQueueService } from "./email/email-queue.service";
import { EmailProcessor } from "./email/email.processor";
import { EmailModule } from "../email/email.module";



@Module({
    imports: [
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
        EmailQueueService,
        EmailProcessor
    ],
    exports: [
        EmailQueueService
    ]
})
export class QueueModule {}