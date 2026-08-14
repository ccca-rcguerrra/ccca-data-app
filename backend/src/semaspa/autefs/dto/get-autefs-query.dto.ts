import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

function toBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value === undefined || value === '' ? undefined : Boolean(value);
}

export const AUTEF_SORT_FIELDS = [
  'id',
  'number',
  'issuedAt',
  'city',
  'issueYear',
  'totalAreaHa',
] as const;

export type AutefSortField = (typeof AUTEF_SORT_FIELDS)[number];

export class GetAutefsQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by number, process number or city (partial, case-insensitive)',
    example: '20139',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by city', example: 'Santarem' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state (UF)', example: 'PA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Filter by issue year', example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  issueYear?: number;

  @ApiPropertyOptional({ description: 'Filter by issue month (1-12)', example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  issueMonth?: number;

  @ApiPropertyOptional({ description: 'Filter by process number (partial)', example: '2024/123' })
  @IsOptional()
  @IsString()
  processNumber?: string;

  @ApiPropertyOptional({ description: 'Issued on or after (ISO date)', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  issuedFrom?: string;

  @ApiPropertyOptional({ description: 'Issued on or before (ISO date)', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  issuedTo?: string;

  @ApiPropertyOptional({
    description: 'Person tax ID (CPF/CNPJ digits; searched on AUTEF roles)',
    example: '12345678901',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Person name (partial; searched on AUTEF-linked people)',
    example: 'SILVA',
  })
  @IsOptional()
  @IsString()
  personName?: string;

  @ApiPropertyOptional({
    description: 'Only AUTEFs with over-extracted volume balances',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isOverExtracted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by presence of linked forest guides',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  hasForestGuide?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum moved ratio (0-1) on any species balance',
    example: 0.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  movedRatioMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum moved ratio (0-1) on any species balance',
    example: 1.2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  movedRatioMax?: number;

  @ApiPropertyOptional({ description: 'Species-product ID', example: 'a1b2c3d4e5f6' })
  @IsOptional()
  @IsString()
  speciesProductId?: string;

  @ApiPropertyOptional({ description: 'Scientific name (partial)', example: 'Manilkara' })
  @IsOptional()
  @IsString()
  scientificName?: string;

  @ApiPropertyOptional({ description: 'Common name (partial)', example: 'Macaranduba' })
  @IsOptional()
  @IsString()
  commonName?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: AUTEF_SORT_FIELDS,
    default: 'id',
  })
  @IsOptional()
  @IsIn([...AUTEF_SORT_FIELDS])
  sortBy?: AutefSortField = 'id';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'ASC';

  @ApiPropertyOptional({
    description: 'Include geometry in response',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  withGeom?: boolean = false;

  @ApiPropertyOptional({
    description: 'Include bounding box [west, south, east, north]',
    example: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  withBbox?: boolean = false;
}
