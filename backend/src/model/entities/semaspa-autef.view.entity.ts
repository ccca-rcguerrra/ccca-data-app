import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';

@ViewEntity({
  name: 'semaspa_autefs',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaAutef {
  @ApiProperty({
    description: 'AUTEF ID',
    example: 1,
    type: Number,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'int4',
  })
  id: number;

  @ApiProperty({
    description: 'AUTEF title',
    example: 'Autorizacao de Exploracao Florestal',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'title' })
  title: string | null;

  @ApiProperty({
    description: 'AUTEF number',
    example: '20139',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'number' })
  number: string | null;

  @ApiProperty({
    description: 'Issue date',
    example: '2024-01-15',
    type: Date,
    nullable: true,
  })
  @ViewColumn({ name: 'issued_at' })
  issuedAt: Date | null;

  @ApiProperty({
    description: 'City',
    example: 'Santarem',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'city' })
  city: string | null;

  @ApiProperty({
    description: 'State (UF)',
    example: 'PA',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'state' })
  state: string | null;

  @ApiProperty({
    description: 'Latitude',
    example: '-2.44306',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'latitude' })
  latitude: string | null;

  @ApiProperty({
    description: 'Longitude',
    example: '-54.70833',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'longitude' })
  longitude: string | null;

  @ApiProperty({
    description: 'Total area in hectares',
    example: 1234.56,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'total_area_ha' })
  totalAreaHa: number | null;

  @ApiProperty({
    description: 'Process number',
    example: '2024/12345',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'process_number' })
  processNumber: string | null;

  @ApiProperty({
    description: 'Issue year',
    example: 2024,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'issue_year' })
  issueYear: number | null;

  @ApiProperty({
    description: 'Issue month',
    example: 1,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'issue_month' })
  issueMonth: number | null;

  @ApiHideProperty()
  @ViewColumn({ name: 'geom' })
  geometry: MultiPolygon | null;
}
