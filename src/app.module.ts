import {  Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exceptions.filter';
import { UsersService } from './users/users.service';
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
    UsersModule,
    CategoriesModule,
    SubCategoriesModule,
    AuthModule,
    
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },
    AppService,
    UsersService
  ],
})
export class AppModule {}
