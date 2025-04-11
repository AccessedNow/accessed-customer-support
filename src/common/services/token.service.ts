import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  decodeToken(token: string): any {
    try {
      const payload = this.jwtService.verify(token, {
        ignoreExpiration: false,
      });

      if (!payload) {
        this.logger.error('Invalid token: no payload');
        return null;
      }

      const userInfo = payload?.user_info;
      if (!userInfo) {
        this.logger.error('Invalid token: missing user info');
        return null;
      }

      if (!userInfo.id || !userInfo.username) {
        this.logger.error('Invalid token: missing required user info fields');
        return null;
      }

      const roles = userInfo.roles || [];
      const privileges = [];

      if (roles.length > 0) {
        roles.forEach((role) => {
          if (
            role.name === 'ROLE_CUSTOMER_SUPPORT' ||
            role.name === 'ROLE_CUSTOMER_SUPPORT_ADMIN' ||
            role.name === 'ROLE_ADMIN'
          ) {
            if (role.privileges && Array.isArray(role.privileges)) {
              role.privileges.forEach((privilege) => {
                if (!privileges.includes(privilege.name)) {
                  privileges.push(privilege.name);
                }
              });
            }
          }
        });
      }

      const user = {
        id: userInfo.id,
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        username: userInfo.username,
        roles: roles.map((r) => r.name),
        privileges,
      };

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        this.logger.error(`Token expired: ${error.message}`);
        throw new UnauthorizedException('Token has expired');
      }
      this.logger.error(`Token verification error: ${error.message}`);
      return null;
    }
  }
}

