import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_species_products',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaSpeciesProduct {
  @ApiProperty({
    description: 'Species-product ID',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({
    description: 'Scientific name',
    example: 'Manilkara huberi',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'scientific_name' })
  scientificName: string | null;

  @ApiProperty({
    description: 'Common name',
    example: 'Macaranduba',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'common_name' })
  commonName: string | null;

  @ApiProperty({
    description: 'Product name',
    example: 'Tora',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'product_name' })
  productName: string | null;

  @ApiProperty({
    description: 'Data source',
    example: 'AUTEF',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'source' })
  source: string | null;

  @ApiProperty({
    description: 'Total occurrences across sources',
    example: 10,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'occurrence_count' })
  occurrenceCount: number | null;
}
