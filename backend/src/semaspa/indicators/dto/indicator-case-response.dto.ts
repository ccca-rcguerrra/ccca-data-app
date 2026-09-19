import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { buildPaginatedResponse } from '../../shared/semaspa-pagination.dto';

export class IndicatorCaseResponseDto {
  @ApiProperty({ enum: ['autef', 'person', 'plate', 'gf'], example: 'autef' })
  entity: 'autef' | 'person' | 'plate' | 'gf';

  @ApiPropertyOptional({ example: 1 })
  autefId?: number;

  @ApiPropertyOptional({ nullable: true, example: '20139/2024' })
  number?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Santarem' })
  city?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'PA' })
  state?: string | null;

  @ApiPropertyOptional({ nullable: true })
  issuedAt?: Date | string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['autef_over_extracted', 'autef_credit_use_over_90'],
  })
  matchedIndicatorIds?: string[];

  @ApiPropertyOptional({ nullable: true, example: 1.47 })
  maxMovedRatio?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 235.5 })
  maxExcessVolume?: number | null;

  @ApiPropertyOptional({ example: false })
  hasUnitConflict?: boolean;

  @ApiPropertyOptional({ example: 'a1b2c3d4e5f6' })
  personId?: string;

  @ApiPropertyOptional({ type: [String], nullable: true })
  names?: string[] | null;

  @ApiPropertyOptional({ nullable: true, example: '12345678901' })
  taxId?: string | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  roleTypes?: string[] | null;

  @ApiPropertyOptional({ example: 4 })
  distinctAutefCount?: number;

  @ApiPropertyOptional({ example: 12 })
  distinctGfCount?: number;

  @ApiPropertyOptional({ example: 'ABC1D23' })
  plate?: string;

  @ApiPropertyOptional({ example: 1717533 })
  forestGuideId?: number;

  @ApiPropertyOptional({ nullable: true, example: 'GF1' })
  type?: string | null;

  @ApiPropertyOptional({ type: [String] })
  matchStatuses?: string[] | null;

  @ApiPropertyOptional({ type: [String] })
  rawReferences?: string[] | null;
}

export class GetIndicatorCasesResponseDto {
  @ApiProperty({ type: [IndicatorCaseResponseDto] })
  data: IndicatorCaseResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;

  constructor(
    data: IndicatorCaseResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    Object.assign(this, buildPaginatedResponse(data, page, limit, total));
  }
}
