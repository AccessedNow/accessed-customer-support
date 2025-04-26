import { User } from 'src/modules/users/schemas/user.schema';
import { BaseRepositoryInterface } from '../base/base.interface.repository';

export interface UsersRepositoryInterface extends BaseRepositoryInterface<User> {}
