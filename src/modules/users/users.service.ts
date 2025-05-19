import { Inject, Logger, Injectable, Scope } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { User } from './schemas/user.schema';
import { UsersRepositoryInterface } from 'src/core/repositories/interfaces/users.interface';

@Injectable({ scope: Scope.REQUEST })
export class UsersService extends BaseServiceAbstract<User> {
  protected readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject('UsersRepositoryInterface')
    protected readonly usersRepository: UsersRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
  ) {
    super(usersRepository, httpService, configService, new Logger(UsersService.name));
  }

  async findUserFromPartyService(userId: string) {
    return this.findUserInCompany(userId);
  }
}
