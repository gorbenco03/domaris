import { Catch, ExceptionFilter, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
    constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

    catch(exception: unknown, host: ArgumentsHost) {
        const { httpAdapter } = this.httpAdapterHost;
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException ? exception.getResponse()  : 'Internal server error';

        // Log the error for debugging
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            console.error('🔴 Internal Server Error:', exception);
        }

        const responseBody = {
            statusCode: status,
            path: request.url,
            message: typeof message === 'string' ? message : (message as any)?.message || 'Unexpected error',
        };

        httpAdapter.reply(response, responseBody, status);
    }
}
