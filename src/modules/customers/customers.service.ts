import { Inject, Logger, Injectable } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Customer } from './schemas/customer.schema';
import { CustomersRepositoryInterface } from 'src/core/repositories/interfaces/customers.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
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

  async findCustomerFromPartyService(customerId: string) {
    return this.findCustomerFromPartyService(customerId);
  }
}
