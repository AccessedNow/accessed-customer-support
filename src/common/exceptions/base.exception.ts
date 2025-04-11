import { HttpException, HttpStatus } from '@nestjs/common';

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  details?: Record<string, any>;
  code?: string;
}

export class BaseException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    error: string = 'Internal Server Error',
    details?: Record<string, any>,
    code?: string,
  ) {
    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error,
      ...(details && { details }),
      ...(code && { code }),
    };

    super(errorResponse, statusCode);
  }
}
