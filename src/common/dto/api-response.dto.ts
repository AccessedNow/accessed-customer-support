import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty({ description: 'Total number of items', example: 100 })
  totalItems: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  itemsPerPage: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Indicates if there is a next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Indicates if there is a previous page', example: false })
  hasPreviousPage: boolean;
}

export class ApiResponse<T> {
  @ApiProperty({ description: 'Status of the API response', example: true })
  success: boolean;

  @ApiPropertyOptional({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message?: string;

  @ApiPropertyOptional({ description: 'Response data' })
  data?: T;

  @ApiPropertyOptional({ description: 'Error message if any', example: null })
  error?: string;

  constructor(success: boolean, data?: T, message?: string, error?: string) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.error = error;
  }

  static success<T>(data?: T, message = 'Operation completed successfully'): ApiResponse<T> {
    return new ApiResponse<T>(true, data, message);
  }

  static error<T>(error: string, message = 'Operation failed'): ApiResponse<T> {
    return new ApiResponse<T>(false, undefined, message, error);
  }
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Status of the API response', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Response message', example: 'Data retrieved successfully' })
  message?: string;

  @ApiProperty({ description: 'List of items', isArray: true })
  items: T[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationMeta })
  meta: PaginationMeta;

  @ApiPropertyOptional({ description: 'Error message if any', example: null })
  error?: string;

  constructor(items: T[], meta: PaginationMeta, message?: string, error?: string) {
    this.success = !error;
    this.items = items;
    this.meta = meta;
    this.message = message;
    this.error = error;
  }

  static create<T>(
    items: T[],
    meta: PaginationMeta,
    message = 'Data retrieved successfully',
  ): PaginatedResponse<T> {
    return new PaginatedResponse<T>(items, meta, message);
  }
}
