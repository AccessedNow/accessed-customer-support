import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosError } from 'axios';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const token = authHeader.split(' ')[1];
    const user = this.tokenService.decodeToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (!user.id) {
      throw new UnauthorizedException('Invalid token payload: missing user info');
    }

    // Add token and user to request for use in interceptors or controllers
    request.token = token;
    request.user = user;

    // Only attempt to validate user in party service if PARTY_SERVICE_URL is configured
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');
    if (!partyServiceUrl) {
      this.logger.warn('PARTY_SERVICE_URL not configured, skipping user validation');
      return true;
    }

    try {
      this.logger.log(
        `Attempting to validate user ${user.id} with party service at ${partyServiceUrl}`,
      );
      const userInParty = await this.validateUserInParty(user.id, token);

      if (!userInParty) {
        this.logger.warn(
          `User ${user.id} not found in party service, but allowing request to continue`,
        );
        // We'll allow the request to continue but log the warning
        return true;
      }

      this.logger.log(`User ${user.id} successfully validated with party service`);
      return true;
    } catch (error) {
      this.logger.error(
        `Error checking user in party service: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      // Allow to continue even if validation fails - this is a business decision
      // If you want stricter security, you could throw an exception here instead
      return true;
    }
  }

  private async validateUserInParty(userId: string, token: string): Promise<any> {
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');

    if (!token) {
      return null;
    }

    try {
      this.logger.debug(
        `Making request to ${partyServiceUrl}/api/admin/company/4:6db934cb-9aba-4675-a007-eb0d31c51391:291738/members/${userId}`,
      );

      const { data: entityExisting } = await firstValueFrom(
        this.httpService
          .get<any>(
            `${partyServiceUrl}/api/admin/company/4:6db934cb-9aba-4675-a007-eb0d31c51391:291738/members/${userId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          )
          .pipe(
            catchError((error: AxiosError) => {
              if (error.response) {
                this.logger.error(
                  `Failed to fetch user data: Status ${error.response.status} - ${error.message}`,
                );
                this.logger.debug(`Response data: ${JSON.stringify(error.response.data)}`);
              } else {
                this.logger.error(`Failed to fetch user data: ${error.message}`);
              }
              throw new Error(`Failed to fetch user data: ${error.message}`);
            }),
          ),
      );

      if (!entityExisting) {
        this.logger.warn(`No data returned for user ${userId}`);
        return null;
      }

      if (!entityExisting.data) {
        this.logger.warn(`No user data found in response for user ${userId}`);
        return null;
      }

      return entityExisting.data;
    } catch (error) {
      this.logger.error(`Error in validateUserInParty: ${error.message}`);
      return null;
    }
  }
}
