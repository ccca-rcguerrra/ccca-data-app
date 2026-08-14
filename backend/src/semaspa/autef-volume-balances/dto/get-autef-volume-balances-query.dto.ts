import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

function toBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value === undefined ? undefined : Boolean(value);
}

export class GetAutefVolumeBalancesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by AUTEF ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  autefId?: number;

  @ApiPropertyOptional({
    description: 'Filter by species-product ID',
    example: 'a1b2c3d4e5f6',
  })
  @IsOptional()
  @IsString()
  speciesProductId?: string;

  @ApiPropertyOptional({
    description: 'Filter over-extracted rows only',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  isOverExtracted?: boolean;

  @ApiPropertyOptional({
    description: 'Filter rows with unit conflict',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  hasUnitConflict?: boolean;
}
