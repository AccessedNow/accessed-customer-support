import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DatabaseException } from '../exceptions/database.exception';
import { BaseException } from '../exceptions/base.exception';

@Injectable()
export class ExceptionInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ExceptionInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // If it's already our custom exception, just rethrow it
        if (error instanceof BaseException) {
          return throwError(() => error);
        }

        // Handle database errors
        if (error.name === 'MongoServerError' || error.name === 'MongoError') {
          // Handle duplicate key error
          if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const message = `Duplicate value for ${field}`;
            return throwError(
              () =>
                new DatabaseException(
                  message,
                  { field, value: error.keyValue[field] },
                  'DUPLICATE_KEY',
                ),
            );
          }

          // Handle other database errors
          return throwError(
            () =>
              new DatabaseException('Database operation failed', {
                errorName: error.name,
                errorMessage: error.message,
                code: error.code,
              }),
          );
        }

        // Log unexpected errors
        this.logger.error(
          `Unexpected error: ${error.message}`,
          error.stack,
          context.getClass().name,
        );

        // Rethrow the error for the global filter to handle
        return throwError(() => error);
      }),
    );
  }
}
