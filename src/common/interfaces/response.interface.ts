export interface PaginatedResponse<T> {
  content: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface ResponseFormat<T> {
  data: T;
  code: number;
  message: string;
}
