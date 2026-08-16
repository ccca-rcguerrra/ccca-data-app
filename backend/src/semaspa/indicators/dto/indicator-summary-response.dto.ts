import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GetIndicatorFiltersDto } from './get-indicator-filters.dto';

export class IndicatorSummaryItemDto {
  @ApiProperty({ example: 'autef_over_extracted' })
  id: string;

  @ApiProperty({ example: 'Volume moved above authorized' })
  name: string;

  @ApiProperty({ example: 'autef' })
  entity: string;

  @ApiProperty({ example: 'informational' })
  severity: string;

  @ApiProperty({ example: 143 })
  count: number;

  @ApiProperty({ example: 'moved_volume > authorized_volume' })
  rule: string;

  @ApiProperty({ example: 1 })
  ruleVersion: number;

  @ApiProperty({ type: [String], example: ['autef', 'species_product', 'gf1'] })
  inputs: string[];

  @ApiProperty({
    type: [String],
    example: ['GF3 volumes are excluded from the balance'],
  })
  limitations: string[];
}

export class IndicatorSummaryResponseDto {
  @ApiProperty({ example: '2026-08-16T00:30:00.000Z' })
  generatedAt: string;

  @ApiPropertyOptional({ type: GetIndicatorFiltersDto })
  filters: GetIndicatorFiltersDto;

  @ApiProperty({ type: [IndicatorSummaryItemDto] })
  indicators: IndicatorSummaryItemDto[];
}
