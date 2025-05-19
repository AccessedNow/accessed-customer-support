import { FindAllResponse } from 'src/common/types/common.type';
import { BaseServiceInterface } from './base.interface.service';
import { BaseRepositoryInterface } from 'src/core/repositories/base/base.interface.repository';
import { BaseSchema } from 'src/core/schemas/base/base.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Inject, Logger, NotFoundException, Injectable, Scope } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { REQUEST } from '@nestjs/core';
import { CustomerInfoDto } from 'src/modules/tickets/dto/customer-info.dto';

@Injectable({ scope: Scope.REQUEST })
export abstract class BaseServiceAbstract<T extends BaseSchema> implements BaseServiceInterface<T> {
  protected readonly logger: Logger;
  protected readonly httpService: HttpService;
  protected readonly configService: ConfigService;
  @Inject(REQUEST) protected readonly request: any;

  constructor(
    protected readonly repository: BaseRepositoryInterface<T>,
    httpService: HttpService,
    configService: ConfigService,
    logger: Logger,
  ) {
    this.httpService = httpService;
    this.configService = configService;
    this.logger = logger;
  }

  protected get token(): string {
    return this.request?.token;
  }

  async create(create_dto: T | any): Promise<T> {
    return await this.repository.create(create_dto);
  }

  async findAll(filter?: object, options?: object): Promise<FindAllResponse<T>> {
    return await this.repository.findAll(filter, options);
  }
  async findOne(id: string) {
    return await this.repository.findOneById(id);
  }

  async findOneByCondition(filter: Partial<T>) {
    return await this.repository.findOneByCondition(filter);
  }

  async update(id: string, update_dto: Partial<T>) {
    return await this.repository.update(id, update_dto);
  }

  async remove(id: string) {
    return await this.repository.softDelete(id);
  }

  protected async findUserInCompany(id: string) {
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');
    const token = this.token;

    const user = await this.repository.findOneByCondition({
      partyId: id,
    });
    if (user) {
      return user;
    }

    const { data: entityExisting } = await firstValueFrom(
      this.httpService
        .get<any>(
          `${partyServiceUrl}/api/admin/company/4:23b2fe67-07bd-4b24-b0df-087ad126c675:291738/members/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Failed to fetch user data: ${error.message}`);
            throw new NotFoundException(`Failed to fetch user data`);
          }),
        ),
    );
    if (!entityExisting) {
      throw new NotFoundException(`User not found`);
    }

    const entity = await this.repository.create({
      partyId: entityExisting.data.id,
      name: entityExisting.data.name,
      firstName: entityExisting.data.firstName,
      lastName: entityExisting.data.lastName,
      email: entityExisting.data.primaryEmail?.value,
      phoneNumber: entityExisting.data.primaryPhone?.value,
      avatar: entityExisting.data.avatar,
      status: entityExisting.data.status,
      countryCode: entityExisting.data.countryCode,
      isoCode2: entityExisting.data.isoCode2,
      timezone: entityExisting.data.timezone,
    });

    return entity;
  }

  protected async findCustomerFromParty(customerInfo: CustomerInfoDto) {
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');
    let customer = null;
    if (customerInfo.partyId) {
      customer = await this.repository.findOneByCondition({
        customerId: customerInfo.partyId || customerInfo.customerId,
      });
    } else if (customerInfo.customerId && customerInfo.email) {
      customer = await this.repository.findOneByCondition({
        customerId: customerInfo.customerId,
        email: customerInfo.email,
      });
    }
    if (customer) {
      return customer;
    }

    const { data: entityExisting } = await firstValueFrom(
      this.httpService
        .post<any>(`${partyServiceUrl}/api/customer/contact-support`, {
          ...customerInfo,
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Failed to fetch customer data: ${error.message}`);
            throw new NotFoundException(`Failed to fetch customer data`);
          }),
        ),
    );
    if (!entityExisting) {
      throw new NotFoundException(`Customer not found`);
    }

    const entity = await this.repository.create({
      customerId: entityExisting.data.customer.id,
      name: entityExisting.data.customer.name,
      firstName: entityExisting.data.customer.firstName,
      middleName: entityExisting.data.customer.middleName,
      lastName: entityExisting.data.customer.lastName,
      email: entityExisting.data.customer.primaryEmail?.value,
      phoneNumber: entityExisting.data.customer.primaryPhone?.value,
      avatar: entityExisting.data.customer.avatar,
      status: entityExisting.data.customer.status,
      countryCode: entityExisting.data.customer.countryCode,
      isoCode2: entityExisting.data.customer.isoCode2,
      timezone: entityExisting.data.customer.timezone,
    });

    return entity;
  }
}
