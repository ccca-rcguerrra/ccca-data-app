import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ANY_INDICATOR_ID, INDICATOR_IDS } from '../indicator-catalog';
import { GetIndicatorFiltersDto } from './get-indicator-filters.dto';
import type { IndicatorSavedFilter } from '../../../model/entities/indicator-saved-filter.entity';

export const SAVED_FILTER_INDICATOR_IDS = [
  ANY_INDICATOR_ID,
  ...Object.values(INDICATOR_IDS),
] as const;

export class CreateSavedFilterDto {
  @ApiProperty({ example: 'Santarem over-extraction', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({
    description: 'Catalog indicator id, or "any". Null/omitted stores the any view.',
    example: 'autef_over_extracted',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsString()
  @IsIn([...SAVED_FILTER_INDICATOR_IDS])
  indicatorId?: string | null;

  @ApiProperty({ type: GetIndicatorFiltersDto })
  @IsObject()
  @ValidateNested()
  @Type(() => GetIndicatorFiltersDto)
  filters: GetIndicatorFiltersDto;
}

export class UpdateSavedFilterDto {
  @ApiPropertyOptional({ example: 'Santarem over-extraction', maxLength: 120 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    description: 'Catalog indicator id, or "any". Null stores the any view.',
    example: 'person_multiple_over_extracted_autefs',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value != null)
  @IsString()
  @IsIn([...SAVED_FILTER_INDICATOR_IDS])
  indicatorId?: string | null;

  @ApiPropertyOptional({ type: GetIndicatorFiltersDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GetIndicatorFiltersDto)
  filters?: GetIndicatorFiltersDto;
}

export class SavedFilterResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Santarem over-extraction' })
  name: string;

  @ApiPropertyOptional({
    example: 'autef_over_extracted',
    nullable: true,
    description: 'Null means the any (volume) view',
  })
  indicatorId: string | null;

  @ApiProperty({ type: GetIndicatorFiltersDto })
  filters: GetIndicatorFiltersDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(entity: IndicatorSavedFilter) {
    this.id = entity.id;
    this.name = entity.name;
    this.indicatorId = entity.indicatorId;
    this.filters = entity.filters ?? {};
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}
