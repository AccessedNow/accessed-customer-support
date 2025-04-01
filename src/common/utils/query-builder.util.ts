export type FilterMap = Record<string, string>;

export class QueryBuilderUtil {
  static buildFilterConditions(
    query: Record<string, any>,
    filterMap: FilterMap,
  ): Record<string, any> {
    const conditions: Record<string, any> = {};

    Object.entries(filterMap).forEach(([queryField, dbField]) => {
      if (query[queryField]) {
        conditions[dbField] = query[queryField];
      }
    });

    if (query.search) {
      conditions.$or = [
        { subject: { $regex: query.search, $options: 'i' } },
        { message: { $regex: query.search, $options: 'i' } },
        { title: { $regex: query.search, $options: 'i' } },
      ];
    }

    return conditions;
  }

  static buildQueryOptions(query: Record<string, any>): Record<string, any> {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    return {
      page,
      limit,
      skip,
      sort: { [query.sort || 'createdAt']: query.sequence === 'asc' ? 1 : -1 },
      lean: true,
    };
  }
}
