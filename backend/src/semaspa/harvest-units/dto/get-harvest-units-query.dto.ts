import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

function toBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value === undefined ? undefined : Boolean(value);
}

export class GetHarvestUnitsQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by property name, holder or process number',
    example: 'Fazenda',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by city', example: 'Santarem' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Include geometry', default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  withGeom?: boolean = false;

  @ApiPropertyOptional({ description: 'Include bounding box', default: false })
  @IsOptional()
  @Transform(({ value }) => toBoolean(value))
  @IsBoolean()
  withBbox?: boolean = false;
}
