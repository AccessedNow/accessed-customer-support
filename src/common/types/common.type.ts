export enum SORT_TYPE {
  'DESC' = 'desc',
  'ASC' = 'acs',
}

export interface FindAllResponse<T> {
  content: T[];
  pageable: {
    sort: {
      unsorted: boolean;
      sort: boolean;
      empty: boolean;
    };
    pageSize: number;
    pageNumber: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  empty: boolean;
}

export type SortParams = { sort_by: string; sort_type: SORT_TYPE };

export type SearchParams = { keywork: string; field: string };

export type PaginateParams = { offset: number; limit: number };
