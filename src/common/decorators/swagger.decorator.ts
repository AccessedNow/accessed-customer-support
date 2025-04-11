import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export interface PaginatedResponseOptions {
  type: Type<any>;
  description?: string;
}

export const ApiPaginatedResponse = (options: PaginatedResponseOptions) => {
  return applyDecorators(
    ApiExtraModels(options.type),
    ApiOkResponse({
      description: options.description || 'Successfully retrieved paginated list',
      schema: {
        allOf: [
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(options.type) },
              },
              meta: {
                type: 'object',
                properties: {
                  totalItems: { type: 'number' },
                  totalPages: { type: 'number' },
                  itemsPerPage: { type: 'number' },
                  currentPage: { type: 'number' },
                  hasNextPage: { type: 'boolean' },
                  hasPreviousPage: { type: 'boolean' },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiStandardResponse = (model: Type<any>, description?: string) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: description || 'Successfully processed request',
      schema: {
        $ref: getSchemaPath(model),
      },
    }),
  );
};

export const ApiStandardListResponse = (model: Type<any>, description?: string) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description: description || 'Successfully retrieved list',
      schema: {
        type: 'array',
        items: { $ref: getSchemaPath(model) },
      },
    }),
  );
};

export const ApiAuth = () => {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid token' }),
    ApiResponse({ status: 403, description: 'Forbidden - Not enough permissions' }),
  );
};

export const ApiErrorResponses = () => {
  return applyDecorators(
    ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' }),
    ApiResponse({ status: 404, description: 'Not Found - Resource not found' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );
};
