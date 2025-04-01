import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseFormat } from '../interfaces/response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseFormat<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data has docs property, convert it to content
        if (data && typeof data === 'object' && 'docs' in data) {
          const { docs, ...rest } = data;
          return {
            data: {
              ...rest,
              content: docs,
            },
            code: 200,
            message: 'Success',
          };
        }

        return {
          data,
          code: 200,
          message: 'Success',
        };
      }),
    );
  }
}
