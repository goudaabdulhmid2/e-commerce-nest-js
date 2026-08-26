import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    // delete properties that do in the DTO
    whitelist: true,
    // throw an error if a property that do not exist in the DTO is sent
    forbidNonWhitelisted: true,
    // automatically transform payloads to be objects typed according to their DTO classes
    transform: true,

    // customize the error response for validation errors
    exceptionFactory: (errors) => {
      return new BadRequestException({
        message: 'Validation failed',
        errors: errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints ?? {}).join(', '),
        })),
      })
    }
  }));

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
