import { Inject, Logger, Injectable, Scope } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Customer } from './schemas/customer.schema';
import { CustomersRepositoryInterface } from 'src/core/repositories/interfaces/customers.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CustomerInfoDto } from '../tickets/dto/customer-info.dto';

@Injectable({ scope: Scope.REQUEST })
export class CustomersService extends BaseServiceAbstract<Customer> {
  protected readonly logger = new Logger(CustomersService.name);

  constructor(
    @Inject('CustomersRepositoryInterface')
    protected readonly customersRepository: CustomersRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
  ) {
    super(customersRepository, httpService, configService, new Logger(CustomersService.name));
  }

  async findCustomerFromPartyService(customerInfo: CustomerInfoDto) {
    return this.findCustomerFromParty(customerInfo);
  }
}
