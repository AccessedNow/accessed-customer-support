import { Activity } from 'src/modules/activities/schemas/activity.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface ActivitiesRepositoryInterface extends BaseRepositoryInterface<Activity> {}
