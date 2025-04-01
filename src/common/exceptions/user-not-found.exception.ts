import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class UserNotFoundException extends BaseException {
  constructor(details?: Record<string, any>) {
    super('User not found', HttpStatus.NOT_FOUND, 'User Not Found', details, 'USER_NOT_FOUND');
  }
}
