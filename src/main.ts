import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      // Remove properties that are not defined in the DTO
      whitelist: true,

      // Instead of silently removing unknown properties,
      // throw a 400 Bad Request error
      forbidNonWhitelisted: true,

      // Transform incoming payloads into DTO instances
      transform: true,

      // Customize the validation error response
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Validation failed',

          errors: errors.map((error) => ({
            // The name of the field that failed validation
            field: error.property,

            // All validation messages for this field
            message: Object.values(
              error.constraints ?? {},
            ).join(', '),
          })),
        });
      },
    }),
  );


  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();