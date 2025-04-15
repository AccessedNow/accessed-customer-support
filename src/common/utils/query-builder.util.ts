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

    if (query.query) {
      conditions.$or = [
        { subject: { $regex: query.query, $options: 'i' } },
        { message: { $regex: query.query, $options: 'i' } },
        { title: { $regex: query.query, $options: 'i' } },
      ];
    }

    return conditions;
  }

  static buildQueryOptions(query: Record<string, any>): Record<string, any> {
    const page = Math.max(0, parseInt(query.page) || 0);
    const limit = parseInt(query.size) || 10;
    const skip = page * limit;

    return {
      page,
      limit,
      skip,
      sort: { [query.sortBy || 'createdAt']: query.sequence === 'asc' ? 1 : -1 },
      lean: true,
    };
  }
}
