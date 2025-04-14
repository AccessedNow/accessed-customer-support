import { Inject, Logger, Injectable } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { EmployeesRepositoryInterface } from 'src/core/repositories/interfaces/employees.interface';
import { Employee } from './schemas/employee.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmployeesService extends BaseServiceAbstract<Employee> {
  protected readonly logger = new Logger(EmployeesService.name);

  constructor(
    @Inject('EmployeesRepositoryInterface')
    protected readonly employeesRepository: EmployeesRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService
  ) {
    super(
      employeesRepository,
      httpService,
      configService,
      new Logger(EmployeesService.name)
    );
  }

  async findEmployeeFromPartyService(employeeId: string) {
    return this.findMemberInCompany(employeeId, 'Employee');
  }
}
