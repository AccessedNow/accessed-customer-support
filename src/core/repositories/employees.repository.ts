import { InjectModel } from '@nestjs/mongoose';

import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { Model } from 'mongoose';
import { EmployeesRepositoryInterface } from './interfaces/employees.interface';
import { Employee } from 'src/modules/employees/schemas/employee.schema';

@Injectable()
export class EmployeesRepository
  extends BaseRepositoryAbstract<Employee>
  implements EmployeesRepositoryInterface
{
  constructor(
    @InjectModel(Employee.name)
    private readonly employeesRepository: Model<Employee>,
  ) {
    super(employeesRepository);
  }
}
