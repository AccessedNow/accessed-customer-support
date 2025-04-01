import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PageSortDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: '1',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: '10',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Sort field',
    example: 'createdAt',
    required: false,
  })
  @IsString()
  @IsOptional()
  sort?: string;

  @ApiProperty({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    required: false,
  })
  @IsString()
  @IsOptional()
  sequence?: string;
}
