import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class UnauthorizedException extends BaseException {
  constructor(
    message: string = 'Unauthorized access',
    details?: Record<string, any>,
    code: string = 'UNAUTHORIZED',
  ) {
    super(message, HttpStatus.UNAUTHORIZED, 'Unauthorized', details, code);
  }
}
