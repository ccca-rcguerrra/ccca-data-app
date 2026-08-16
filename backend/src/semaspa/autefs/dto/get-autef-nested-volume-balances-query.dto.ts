import { IsIn, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export const AUTEF_VOLUME_BALANCE_SORT_FIELDS = [
  'excessVolume',
  'movedRatio',
  'authorizedVolume',
  'id',
] as const;

export type AutefVolumeBalanceSortField =
  (typeof AUTEF_VOLUME_BALANCE_SORT_FIELDS)[number];

export class GetAutefNestedVolumeBalancesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Sort field. Default excessVolume (largest discrepancy first).',
    enum: AUTEF_VOLUME_BALANCE_SORT_FIELDS,
    default: 'excessVolume',
  })
  @IsOptional()
  @IsIn([...AUTEF_VOLUME_BALANCE_SORT_FIELDS])
  sortBy?: AutefVolumeBalanceSortField = 'excessVolume';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
