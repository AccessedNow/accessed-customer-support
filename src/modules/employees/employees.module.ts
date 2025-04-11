import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from 'src/core/repositories/employees.repository';
import { Employee } from './schemas/employee.schema';
import { EmployeeSchema } from './schemas/employee.schema';
import * as https from 'https';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Employee.name, schema: EmployeeSchema }]),
    HttpModule.register({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }),
  ],
  providers: [
    EmployeesService,
    { provide: 'EmployeesRepositoryInterface', useClass: EmployeesRepository },
  ],
  exports: [EmployeesService],
})
export class EmployeesModule {}
