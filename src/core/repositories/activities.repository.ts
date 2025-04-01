import { Injectable } from '@nestjs/common';
import { BaseRepositoryAbstract } from './base/base.abstract.repository';
import { ActivitiesRepositoryInterface } from './interfaces/activities.interface';
import { Activity } from 'src/modules/activities/schemas/activity.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ActivitiesRepository
  extends BaseRepositoryAbstract<Activity>
  implements ActivitiesRepositoryInterface
{
  constructor(
    @InjectModel(Activity.name)
    private readonly activitiesRepository: Model<Activity>,
  ) {
    super(activitiesRepository);
  }
}
