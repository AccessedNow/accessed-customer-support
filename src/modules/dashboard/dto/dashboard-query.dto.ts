import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString, IsDateString, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

export class DashboardQueryDto {
  @ApiPropertyOptional({
    description:
      'Period for analysis (e.g., 30d, 7d). If provided, startDate and endDate will be ignored.',
    example: '30d',
  })
  @IsOptional()
  @IsString()
  period?: string;

  @ApiPropertyOptional({
    description: 'Start date for custom time range (ISO string)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ValidateIf((o) => !o.period)
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for custom time range (ISO string)',
    example: '2024-01-31T23:59:59.999Z',
  })
  @ValidateIf((o) => !o.period)
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether to compare with previous period',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  compare?: boolean = true;

  @ApiPropertyOptional({
    description: 'Data granularity (daily, weekly)',
    example: 'daily',
  })
  @IsOptional()
  @IsString()
  granularity?: string = 'daily';

  @ApiPropertyOptional({
    description: 'Filter by ticket status (active, all)',
    example: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string = 'active';
}
