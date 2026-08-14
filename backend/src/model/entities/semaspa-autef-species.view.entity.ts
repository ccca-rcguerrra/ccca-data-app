import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_autef_species',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaAutefSpecies {
  @ApiProperty({
    description: 'Surrogate key of autef_id + species_product_id',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({
    description: 'AUTEF ID',
    example: 1,
    type: Number,
  })
  @ViewColumn({ name: 'autef_id' })
  autefId: number;

  @ApiProperty({
    description: 'Species-product ID',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @ViewColumn({ name: 'species_product_id' })
  speciesProductId: string;

  @ApiProperty({
    description: 'Authorized volume',
    example: 150.5,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'volume' })
  volume: number | null;

  @ApiProperty({
    description: 'Unit of measure',
    example: 'M3',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'unit' })
  unit: string | null;
}
