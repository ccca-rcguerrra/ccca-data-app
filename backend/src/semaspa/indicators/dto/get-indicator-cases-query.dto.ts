import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GetIndicatorFiltersDto } from './get-indicator-filters.dto';

export const INDICATOR_CASE_SORT_FIELDS = [
  'issuedAt',
  'number',
  'city',
  'maxMovedRatio',
  'maxExcessVolume',
] as const;

export type IndicatorCaseSortField =
  (typeof INDICATOR_CASE_SORT_FIELDS)[number];

export class GetIndicatorCasesQueryDto extends GetIndicatorFiltersDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: INDICATOR_CASE_SORT_FIELDS,
    default: 'issuedAt',
  })
  @IsOptional()
  @IsIn([...INDICATOR_CASE_SORT_FIELDS])
  sortBy?: IndicatorCaseSortField = 'issuedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
