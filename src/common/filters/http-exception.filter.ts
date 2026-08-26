import { Catch, ExceptionFilter } from "@nestjs/common";
import { ArgumentsHost, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";

// The `@Catch` decorator in NestJS is used to define an exception filter that can handle specific types of exceptions thrown during the execution of a request. When you apply the `@Catch` decorator to a class, you specify the type of exception(s) that the filter should handle.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {

    // The `catch` method is called when an exception of the specified type (in this case, `HttpException`) is thrown. It receives the exception object and the `ArgumentsHost`, which provides access to the underlying request and response objects.
    catch(exception: HttpException, host: ArgumentsHost){

        // The `switchToHttp` method is used to switch the context to HTTP, allowing access to the request and response objects. This is necessary because NestJS supports multiple contexts (e.g., WebSocket, RPC), and we need to ensure we're working with the HTTP context.
        const ctx = host.switchToHttp();


        const response = ctx.getResponse<Response>()
        const request = ctx.getRequest<Request>()

        
        const statusCode = exception.getStatus() || HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = exception.getResponse()

        
        let errors: unknown[] = [];
        let message = 'An error occurred';



       // The `getResponse` method of the `HttpException` class returns the response body that was set when the exception was created. This can be a string or an object, depending on how the exception was thrown. We need to handle both cases to extract the error message properly.
        if(typeof exceptionResponse === 'string'){
            message = exceptionResponse;
        }else if(typeof exceptionResponse === 'object' && exceptionResponse !== null){

            const body = exceptionResponse as {
                message?: string,
                errors?: unknown[]
            }

            message = body.message ?? message;
            errors = body.errors ?? [];

        }


        response.status(statusCode).json({
            success: false,
            statusCode: statusCode,
            message,
            errors,
            timestamp: new Date().toISOString(),
            path: request.url
        })
    }
}