import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PRIVILEGES_KEY = 'requiredPrivileges';
export const RequirePrivileges = (...privileges: string[]) =>
  SetMetadata(REQUIRED_PRIVILEGES_KEY, privileges);
