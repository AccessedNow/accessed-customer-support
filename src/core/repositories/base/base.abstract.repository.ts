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

    const page = options?.page || 0;
    const limit = options?.limit || 10;
    const totalPages = Math.ceil(count / limit);

    return {
      content: items,
      pageable: {
        sort: {
          unsorted: false,
          sort: true,
          empty: false,
        },
        pageSize: limit,
        pageNumber: page,
        offset: page * limit,
        paged: items.length > 0,
        unpaged: items.length === 0,
      },
      last: page >= totalPages - 1,
      totalPages: totalPages,
      totalElements: count,
      first: page === 0,
      numberOfElements: items.length,
      size: limit,
      number: page,
      empty: items.length === 0,
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
