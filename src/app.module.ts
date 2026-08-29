import {  Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exceptions.filter';
import { UsersService } from './users/users.service';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EmailModule } from './common/email/email.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { QueueModule } from './common/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('DB_URL'),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60 sec
        limit:100 // 100 request
      }
    ]),
    EventEmitterModule.forRoot(),
    UsersModule,
    CategoriesModule,
    SubCategoriesModule,
    AuthModule,
    EmailModule,
    QueueModule
    
  ],
  providers: [
    {
      provide: APP_GUARD, 
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },
    AppService,
    UsersService
  ],

  controllers: [AppController],
})
export class AppModule {}
