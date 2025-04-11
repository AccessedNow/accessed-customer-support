import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class DatabaseException extends BaseException {
  constructor(
    message: string = 'Database operation failed',
    details?: Record<string, any>,
    code: string = 'DATABASE_ERROR',
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, 'Database Error', details, code);
  }
}
