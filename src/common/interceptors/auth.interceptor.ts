import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { REQUIRED_PRIVILEGES_KEY } from '../decorators/require-privileges.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AUTH_ONLY_KEY } from '../decorators/auth-only.decorator';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    console.log('authHeader', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const token = authHeader.split(' ')[1];
    const user = this.tokenService.decodeToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Add token to request
    request.token = token;

    // Check if the route is auth-only (no permission checks)
    const isAuthOnly = this.reflector.getAllAndOverride<boolean>(
      AUTH_ONLY_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (isAuthOnly) {
      request.user = user;
      return next.handle();
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    ) || ['ROLE_CUSTOMER_SUPPORT', 'ROLE_CUSTOMER_SUPPORT_ADMIN', 'ROLE_ADMIN'];

    if (requiredRoles.length && !this.matchRoles(requiredRoles, user)) {
      throw new ForbiddenException(
        `User does not have the required role(s): ${requiredRoles.join(', ')}`
      );
    }

    const requiredPrivileges = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PRIVILEGES_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (
      requiredPrivileges &&
      requiredPrivileges.length &&
      !this.matchPrivileges(requiredPrivileges, user)
    ) {
      throw new ForbiddenException(
        `User does not have the required privilege(s): ${requiredPrivileges.join(', ')}`
      );
    }

    request.user = user;
    return next.handle();
  }

  private matchRoles(requiredRoles: string[], user: any): boolean {
    if (!user.roles || !Array.isArray(user.roles)) {
      return false;
    }
    return requiredRoles.some((role) => user.roles.includes(role));
  }

  private matchPrivileges(requiredPrivileges: string[], user: any): boolean {
    if (!user.privileges || !Array.isArray(user.privileges)) {
      return false;
    }
    return requiredPrivileges.every((privilege) =>
      user.privileges.includes(privilege)
    );
  }
}
