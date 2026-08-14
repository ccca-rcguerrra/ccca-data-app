import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';

export class TerritoryResponseDto {
  @ApiProperty({
    description: 'Unique territory ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Territory version',
    example: 1,
    type: Number,
  })
  version: number;

  @ApiProperty({
    description: 'Territory name',
    example: 'Amazonas',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Territory category',
    example: 'state',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Territory category name (human friendly)',
    example: 'State',
    type: String,
    nullable: true,
    required: false,
  })
  categoryName: string | null;

  @ApiProperty({
    description: 'Territory source',
    example: 'ibge',
    type: String,
  })
  source: string;

  @ApiProperty({
    description: 'Territory area in hectares',
    example: 1570000.5,
    type: Number,
    nullable: true,
    required: false,
  })
  areaHa: number | null;

  @ApiProperty({
    description: 'Whether territory is enabled',
    example: true,
    type: Boolean,
  })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Territory geometry (MultiPolygon)',
    example: null,
    nullable: true,
    required: false,
  })
  geometry?: MultiPolygon | null;

  @ApiPropertyOptional({
    description: 'Territory bounding box as [west, south, east, north] (lng/lat). Present when withBbox=true.',
    example: [-73.99, -9.82, -56.09, 2.24],
    type: [Number],
    nullable: true,
    required: false,
  })
  bbox?: [number, number, number, number] | null;
}

