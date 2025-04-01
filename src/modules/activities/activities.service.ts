import { Inject, Injectable, Logger } from '@nestjs/common';
import { BaseServiceAbstract } from 'src/core/services/base/base.abstract.service';
import { Activity } from './schemas/activity.schema';
import { ActivitiesRepositoryInterface } from 'src/core/repositories/interfaces/activities.interface';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FilterMap, QueryBuilderUtil } from 'src/common/utils/query-builder.util';
import { QueryActivityDto } from './dto/query-activity.dto';

@Injectable()
export class ActivitiesService extends BaseServiceAbstract<Activity> {
  protected readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @Inject('ActivitiesRepositoryInterface')
    protected readonly activitiesRepository: ActivitiesRepositoryInterface,
    protected readonly httpService: HttpService,
    protected readonly configService: ConfigService,
  ) {
    super(activitiesRepository, httpService, configService, new Logger(ActivitiesService.name));
  }

  async findAll({ ticketId, query }: { ticketId: string; query: QueryActivityDto }) {
    const filterMap: FilterMap = {
      ticket: 'ticket',
      type: 'type',
      createdBy: 'createdBy.id',
    };
    const conditions = QueryBuilderUtil.buildFilterConditions(
      { ...query, ticket: ticketId },
      filterMap,
    );
    const options = QueryBuilderUtil.buildQueryOptions(query);
    const populateOptions = {
      populate: [
        {
          path: 'createdBy',
          select: 'id name',
        },
      ],
      sort: { createdAt: -1 },
    };

    return await this.activitiesRepository.findAll(conditions, {
      ...options,
      ...populateOptions,
    });
  }
}
