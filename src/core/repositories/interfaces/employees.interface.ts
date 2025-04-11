import { Employee } from 'src/modules/employees/schemas/employee.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface EmployeesRepositoryInterface extends BaseRepositoryInterface<Employee> {}
