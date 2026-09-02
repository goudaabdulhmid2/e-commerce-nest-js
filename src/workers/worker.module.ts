import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { DatabaseModule } from "src/common/database/database.module";
import { EmailModule } from "src/common/email/email.module";
import { IdempotencyModule } from "src/common/idempotency/idempotency.module";
import { EmailProcessor } from "src/common/queue/email/email.processor";
import { envValidationSchema } from "src/config/env.validtion";



@Module({
  imports: [
    // Load and validate environment variables.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,

      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Establish the MongoDB connection.
    DatabaseModule,

    // Register email-related services.
    EmailModule,

    // Register idempotency models and repositories.
    IdempotencyModule,

    // Configure BullMQ with Redis.
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>(
            'REDIS_HOST',
            'localhost',
          ),
          port: configService.get<number>(
            'REDIS_PORT',
            6379,
          ),
        },
      }),
    }),

    // Register the email queue.
    BullModule.registerQueue({
      name: 'email',
    }),
  ],

  providers: [
    EmailProcessor,
  ],
})
export class WorkerModule {}