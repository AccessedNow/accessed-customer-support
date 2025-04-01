import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      message =
        typeof response === 'string' ? response : (response as any).message || 'Error occurred';
    }

    const stack = exception instanceof Error ? exception.stack : undefined;

    // Log the error with context
    this.logger.error(
      `Exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
      stack,
      `${request.method} ${request.url}`,
    );

    // Structure the error response
    const errorResponse: ErrorResponse = {
      data: {
        code: status,
        message: message,
        stack: stack,
      },
      code: status,
      message: 'Success',
    };

    response.status(status).json(errorResponse);
  }
}
