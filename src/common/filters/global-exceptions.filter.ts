import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { Request, Response } from 'express';

interface MongooseValidationError {
  name: 'ValidationError';

  errors: Record<
    string,
    {
      path: string;
      message: string;
    }
  >;
}

interface MongooseCastError {
  name: 'CastError';
  path: string;
  value: unknown;
}

interface MongoDuplicateKeyError {
  code: 11000;
  keyValue?: Record<string, unknown>;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(
    GlobalExceptionFilter.name,
  );

  catch(
    exception: unknown,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';

    let errors: unknown[] = [];

    // ==============================
    // NestJS HTTP Exceptions
    // ==============================

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();

      const exceptionResponse =
        exception.getResponse();

        if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
        } else if (
                typeof exceptionResponse === 'object' &&
                exceptionResponse !== null
              ) {
                const body = exceptionResponse as {
                  message?: string;
                  errors?: unknown[];
                };

                message = body.message ?? message;
                errors = body.errors ?? [];
              }
    }

    // ==============================
    // MongoDB Duplicate Key
    // ==============================

    else if (
      this.isMongoDuplicateKeyError(exception)
    ) {
      statusCode = HttpStatus.CONFLICT;

      const field = exception.keyValue
        ? Object.keys(exception.keyValue)[0]
        : 'field';

      message = `${field} already exists`;
    }

    // ==============================
    // Mongoose Validation Error
    // ==============================

    else if (
      this.isMongooseValidationError(exception)
    ) {
      statusCode = HttpStatus.BAD_REQUEST;

      message = 'Invalid input data';

      errors = Object.values(
        exception.errors,
      ).map((error) => ({
        field: error.path,
        message: error.message,
      }));
    }

    // ==============================
    // Mongoose Cast Error
    // ==============================

    else if (
      this.isMongooseCastError(exception)
    ) {
      statusCode = HttpStatus.BAD_REQUEST;

      message = `Invalid ${exception.path}: ${String(
        exception.value,
      )}`;
    }

    // ==============================
    // Unexpected Error
    // ==============================

    else {
      this.logger.error(exception);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  // --------------------------------
  // Type Guards
  // --------------------------------

  private isMongooseValidationError(
    exception: unknown,
  ): exception is MongooseValidationError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'name' in exception &&
      exception.name === 'ValidationError' &&
      'errors' in exception
    );
  }

  private isMongooseCastError(
    exception: unknown,
  ): exception is MongooseCastError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'name' in exception &&
      exception.name === 'CastError' &&
      'path' in exception &&
      'value' in exception
    );
  }

  private isMongoDuplicateKeyError(
    exception: unknown,
  ): exception is MongoDuplicateKeyError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      exception.code === 11000
    );
  }
}