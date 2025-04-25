import { FindAllResponse } from 'src/common/types/common.type';
import { BaseServiceInterface } from './base.interface.service';
import { BaseRepositoryInterface } from 'src/core/repositories/base/base.interface.repository';
import { BaseSchema } from 'src/core/schemas/base/base.schema';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { REQUEST } from '@nestjs/core';

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

  protected async findMemberInCompany(id: string) {
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');
    const token = this.token;

    const entityInDB = await this.repository.findOneByCondition({
      partyId: id,
    });
    if (entityInDB) {
      return entityInDB;
    }

    const { data: entityExisting } = await firstValueFrom(
      this.httpService
        .get<any>(
          `${partyServiceUrl}/api/admin/company/4:6db934cb-9aba-4675-a007-eb0d31c51391:291738/members/${id}`,
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

  protected async findCustomerFromPartyService(id: string) {
    const partyServiceUrl = this.configService.get<string>('PARTY_SERVICE_URL');

    const entityInDB = await this.repository.findOneByCondition({
      customerId: id,
    });
    if (entityInDB) {
      return entityInDB;
    }

    const { data: entityExisting } = await firstValueFrom(
      this.httpService.get<any>(`${partyServiceUrl}/api/user/${id}`).pipe(
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
      customerId: entityExisting.data.id,
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
}
