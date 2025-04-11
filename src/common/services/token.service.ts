import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(private readonly jwtService: JwtService) {}

  decodeToken(token: string): any {
    try {
      const payload = this.jwtService.decode(token);

      if (!payload) {
        this.logger.error('Invalid token: no payload');
        return null;
      }

      const userInfo = payload?.user_info;
      if (!userInfo) {
        this.logger.error('Invalid token: missing user info');
        return null;
      }

      const roles = userInfo.roles || [];
      const privileges = [];

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

      const customer = {
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: userInfo.username,
        roles: roles.map((r) => r.name),
        privileges,
      };

      return customer;
    } catch (error) {
      this.logger.error(`Token decode error: ${error.message}`);
      return null;
    }
  }
}
