import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Customer } from 'src/modules/customers/schemas/customer.schema';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { CustomersRepositoryInterface } from './interfaces/customers.interface';

@Injectable()
export class CustomersRepository
  extends BaseRepositoryAbstract<Customer>
  implements CustomersRepositoryInterface
{
  constructor(
    @InjectModel(Customer.name)
    private readonly customersRepository: Model<Customer>,
  ) {
    super(customersRepository);
  }
}
