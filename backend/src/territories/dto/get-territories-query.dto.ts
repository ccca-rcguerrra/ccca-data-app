import { IsOptional, IsInt, Min, Max, IsString, IsBoolean, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetTerritoriesQueryDto {
  @ApiProperty({
    description: 'Page number',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description:
      'Filter territories by name (partial match, accent-insensitive via unaccent)',
    example: 'Para',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by territory category. Comma-separated for multiple (e.g. state,city,refined_biome)',
    example: 'state',
    type: String,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (typeof value === 'string') {
      return value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return undefined;
  })
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiProperty({
    description: 'Include geometry in response',
    example: false,
    type: Boolean,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value === undefined ? false : Boolean(value);
  })
  @IsBoolean()
  withGeom?: boolean = false;

  @ApiProperty({
    description: 'Include the territory bounding box ([west, south, east, north]) in the response',
    example: false,
    type: Boolean,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value === undefined ? false : Boolean(value);
  })
  @IsBoolean()
  withBbox?: boolean = false;
}

