import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_forest_guide_species',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaForestGuideSpecies {
  @ApiProperty({
    description: 'Surrogate key of forest_guide_id + species_product_id',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({
    description: 'Forest guide ID',
    example: 1,
    type: Number,
  })
  @ViewColumn({ name: 'forest_guide_id' })
  forestGuideId: number;

  @ApiProperty({
    description: 'Species-product ID',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @ViewColumn({ name: 'species_product_id' })
  speciesProductId: string;

  @ApiProperty({
    description: 'Transported volume',
    example: 50.25,
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

  @ApiProperty({
    description: 'Declared value',
    example: 12500.0,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'value' })
  value: number | null;
}
