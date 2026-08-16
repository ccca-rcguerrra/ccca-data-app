import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetIndicatorFiltersDto {
  @ApiPropertyOptional({ description: 'Filter by city', example: 'Santarem' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state (UF)', example: 'PA' })
  @IsOptional()
  @IsString()
  state?: string;

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

  @ApiPropertyOptional({
    description: 'Minimum moved ratio (0-1 scale) on matching balances',
    example: 0.9,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  movedRatioMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum moved ratio (0-1 scale) on matching balances',
    example: 1.5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  movedRatioMax?: number;

  @ApiPropertyOptional({
    description: 'Minimum excess volume on matching balances',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  excessVolumeMin?: number;
}
