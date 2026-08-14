import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export const FOREST_GUIDE_SORT_FIELDS = [
  'id',
  'number',
  'issuedAt',
  'status',
  'type',
] as const;

export type ForestGuideSortField = (typeof FOREST_GUIDE_SORT_FIELDS)[number];

export class GetForestGuidesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by forest guide number (partial, case-insensitive)',
    example: 'GF-2024',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status', example: 'ATIVO' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by type', example: 'GF1' })
  @IsOptional()
  @IsString()
  type?: string;

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

  @ApiPropertyOptional({ description: 'Linked AUTEF ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  autefId?: number;

  @ApiPropertyOptional({
    description: 'Person tax ID (CPF/CNPJ; ORIGEM_GF / DESTINO_GF)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Person name (partial; ORIGEM_GF / DESTINO_GF)',
    example: 'SILVA',
  })
  @IsOptional()
  @IsString()
  personName?: string;

  @ApiPropertyOptional({ description: 'Species-product ID' })
  @IsOptional()
  @IsString()
  speciesProductId?: string;

  @ApiPropertyOptional({ description: 'Scientific name (partial)' })
  @IsOptional()
  @IsString()
  scientificName?: string;

  @ApiPropertyOptional({ description: 'Common name (partial)' })
  @IsOptional()
  @IsString()
  commonName?: string;

  @ApiPropertyOptional({ description: 'Vehicle plate (exact match in array)', example: 'ABC1D23' })
  @IsOptional()
  @IsString()
  plate?: string;

  @ApiPropertyOptional({ description: 'Permit reference (exact match in array)' })
  @IsOptional()
  @IsString()
  permitRef?: string;

  @ApiPropertyOptional({ description: 'Minimum transported volume on any species line' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volumeMin?: number;

  @ApiPropertyOptional({ description: 'Maximum transported volume on any species line' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  volumeMax?: number;

  @ApiPropertyOptional({ description: 'Minimum declared value on any species line' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valueMin?: number;

  @ApiPropertyOptional({ description: 'Maximum declared value on any species line' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valueMax?: number;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: FOREST_GUIDE_SORT_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn([...FOREST_GUIDE_SORT_FIELDS])
  sortBy?: ForestGuideSortField = 'id';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
