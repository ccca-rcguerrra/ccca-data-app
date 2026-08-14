import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';

@ViewEntity({
  name: 'mv_current_territories',
  schema: 'public_app',
  synchronize: false,
})
export class CurrentTerritoryView {
  @ApiProperty({
    description: 'Territory ID',
    example: 1,
    type: Number,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'int4',
  })
  id: number;

  @ApiProperty({
    description: 'Territory version (latest enabled version)',
    example: 3,
    type: Number,
  })
  @ViewColumn({
    name: 'version',
  })
  version: number;

  @ApiProperty({
    description: 'Territory name',
    example: 'Amazonas',
    type: String,
  })
  @ViewColumn({
    name: 'name',
  })
  name: string;

  @ApiProperty({
    description: 'Territory source',
    example: 'IBGE',
    type: String,
  })
  @ViewColumn({
    name: 'source',
  })
  source: string;

  @ApiProperty({
    description: 'Timestamp when territory was inserted',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @ViewColumn({
    name: 'inserted_at',
  })
  insertedAt: Date;

  @ApiProperty({
    description: 'Timestamp when territory was last updated',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @ViewColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Territory category',
    example: 'state',
    type: String,
  })
  @ViewColumn({
    name: 'category',
  })
  category: string;

  @ApiProperty({
    description: 'Territory category name (human friendly)',
    example: 'State',
    type: String,
    nullable: true,
  })
  @ViewColumn({
    name: 'category_name',
  })
  categoryName: string | null;

  @ApiProperty({
    description: 'Area in hectares',
    example: 12345.6789,
    type: Number,
    nullable: true,
  })
  @ViewColumn({
    name: 'area_ha',
  })
  areaHa: number | null;

  @ApiProperty({
    description: 'Whether the territory is enabled',
    example: true,
    type: Boolean,
  })
  @ViewColumn({
    name: 'enabled',
  })
  enabled: boolean;

  @ApiHideProperty()
  @ViewColumn({
    name: 'geom',
  })
  geometry: MultiPolygon | null;

  @ApiHideProperty()
  @ViewColumn({
    name: 'old_geom',
  })
  oldGeometry: MultiPolygon | null;
}
