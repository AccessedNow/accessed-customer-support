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

      const customer = {
        id: userInfo.id,
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        username: userInfo.username,
      };

      return customer;
    } catch (error) {
      this.logger.error(`Token decode error: ${error.message}`);
      return null;
    }
  }
}
