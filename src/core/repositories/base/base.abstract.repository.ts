import { FilterQuery, Model, QueryOptions } from 'mongoose';
import { BaseRepositoryInterface } from './base.interface.repository';
import { FindAllResponse } from 'src/common/types/common.type';
import { BaseSchema } from 'src/core/schemas/base/base.schema';

export abstract class BaseRepositoryAbstract<T extends BaseSchema>
  implements BaseRepositoryInterface<T>
{
  protected constructor(private readonly model: Model<T>) {
    this.model = model;
  }

  async create(dto: T | any): Promise<T> {
    const createdData = await this.model.create(dto);
    return createdData.save();
  }

  async findOneById(id: string, projection?: string, options?: QueryOptions<T>): Promise<T> {
    const item = await this.model.findById(id, projection, options);
    if (!item) return null;
    return item.deletedAt ? null : item;
  }

  async findOneByCondition(condition = {}): Promise<T> {
    return await this.model
      .findOne({
        ...condition,
        deletedAt: null,
      })
      .exec();
  }

  async findAll(condition: FilterQuery<T>, options?: QueryOptions<T>): Promise<FindAllResponse<T>> {
    const [count, items] = await Promise.all([
      this.model.countDocuments({ ...condition, deletedAt: null }),
      this.model.find({ ...condition, deletedAt: null }, options?.projection, options),
    ]);
    return {
      docs: items,
      totalDocs: count,
      limit: options?.limit || 10,
      totalPages: Math.ceil(count / (options?.limit || 10)),
      page: options?.page || 1,
      pagingCounter: ((options?.page || 1) - 1) * (options?.limit || 10) + 1,
      hasPrevPage: (options?.page || 1) > 1,
      hasNextPage: (options?.page || 1) * (options?.limit || 10) < count,
      prevPage: (options?.page || 1) > 1 ? (options?.page || 1) - 1 : null,
      nextPage:
        (options?.page || 1) * (options?.limit || 10) < count ? (options?.page || 1) + 1 : null,
    };
  }

  async update(id: string, dto: Partial<T>): Promise<T> {
    return await this.model.findOneAndUpdate({ _id: id, deletedAt: null }, dto, { new: true });
  }

  async softDelete(id: string): Promise<boolean> {
    const delete_item = await this.model.findById(id);
    if (!delete_item) {
      return false;
    }

    return !!(await this.model.findByIdAndUpdate<T>(id, { deletedAt: new Date() }).exec());
  }

  async permanentlyDelete(id: string): Promise<boolean> {
    const delete_item = await this.model.findById(id);
    if (!delete_item) {
      return false;
    }
    return !!(await this.model.findOneAndDelete({ _id: id }));
  }
}
