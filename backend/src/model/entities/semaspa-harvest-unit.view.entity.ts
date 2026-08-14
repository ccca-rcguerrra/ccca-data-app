import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';

@ViewEntity({
  name: 'semaspa_harvest_units',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaHarvestUnit {
  @ApiProperty({
    description: 'Harvest unit (UPA) ID',
    example: 1,
    type: Number,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'int4',
  })
  id: number;

  @ApiProperty({
    description: 'Holder name',
    example: 'Empresa Florestal Ltda',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'holder' })
  holder: string | null;

  @ApiProperty({
    description: 'Property name',
    example: 'Fazenda Exemplo',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'property_name' })
  propertyName: string | null;

  @ApiProperty({
    description: 'Process number',
    example: '2024/12345',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'process_number' })
  processNumber: string | null;

  @ApiProperty({
    description: 'AUTEF number',
    example: '20139',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'autef_number' })
  autefNumber: string | null;

  @ApiProperty({
    description: 'AUTEF year',
    example: '2024',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'autef_year' })
  autefYear: string | null;

  @ApiProperty({
    description: 'AUTEF validity',
    example: '31/12/2025',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'autef_validity' })
  autefValidity: string | null;

  @ApiProperty({
    description: 'City',
    example: 'Santarem',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'city' })
  city: string | null;

  @ApiProperty({
    description: 'Property area in hectares (raw text from source)',
    example: '1500.00',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'property_area_ha' })
  propertyAreaHa: string | null;

  @ApiProperty({
    description: 'Unit area in hectares (raw text from source)',
    example: '500.00',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'unit_area_ha' })
  unitAreaHa: string | null;

  @ApiProperty({
    description: 'Net area in hectares (raw text from source)',
    example: '450.00',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'net_area_ha' })
  netAreaHa: string | null;

  @ApiProperty({
    description: 'Volume in cubic meters (raw text from source)',
    example: '12000.5',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'volume_m3' })
  volumeM3: string | null;

  @ApiHideProperty()
  @ViewColumn({ name: 'geom' })
  geometry: MultiPolygon | null;
}
