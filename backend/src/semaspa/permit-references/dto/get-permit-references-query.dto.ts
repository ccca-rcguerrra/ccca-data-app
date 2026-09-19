import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';
import { PERMIT_REFERENCE_MATCH_STATUSES } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';
import type { PermitReferenceMatchStatus } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';

export class GetPermitReferencesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    enum: PERMIT_REFERENCE_MATCH_STATUSES,
    description: 'Filter by parse/match status',
  })
  @IsOptional()
  @IsString()
  @IsIn([...PERMIT_REFERENCE_MATCH_STATUSES])
  matchStatus?: PermitReferenceMatchStatus;

  @ApiPropertyOptional({
    description: 'Issued on or after (ISO date)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  issuedFrom?: string;

  @ApiPropertyOptional({
    description: 'Issued on or before (ISO date)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  issuedTo?: string;

  @ApiPropertyOptional({ description: 'Forest guide type', example: 'GF1' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Restrict to forest guides that declare more than one AUTEF reference',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  multiple?: boolean;

  @ApiPropertyOptional({
    description: 'Search original reference text (partial, case-insensitive)',
    example: '20139',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
