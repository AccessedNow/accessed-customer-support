import { MongooseModule } from '@nestjs/mongoose';
import { CustomersRepository } from 'src/core/repositories/customers.repository';
import { CustomersService } from './customers.service';
import { Customer } from './schemas/customer.schema';
import { CustomerSchema } from './schemas/customer.schema';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import * as https from 'https';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
    HttpModule.register({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }),
  ],
  providers: [
    CustomersService,
    { provide: 'CustomersRepositoryInterface', useClass: CustomersRepository },
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
