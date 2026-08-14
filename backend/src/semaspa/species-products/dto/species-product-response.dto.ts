import { ApiProperty } from '@nestjs/swagger';
import { SemaspaSpeciesProduct } from '../../../model/entities/semaspa-species-product.view.entity';

export class SpeciesProductResponseDto {
  @ApiProperty({ description: 'Species-product ID', example: 'a1b2c3d4e5f6' })
  id: string;

  @ApiProperty({ description: 'Scientific name', nullable: true })
  scientificName: string | null;

  @ApiProperty({ description: 'Common name', nullable: true })
  commonName: string | null;

  @ApiProperty({ description: 'Product name', nullable: true })
  productName: string | null;

  @ApiProperty({ description: 'Data source', nullable: true })
  source: string | null;

  @ApiProperty({ description: 'Occurrence count', nullable: true })
  occurrenceCount: number | null;

  constructor(entity: SemaspaSpeciesProduct) {
    this.id = entity.id;
    this.scientificName = entity.scientificName;
    this.commonName = entity.commonName;
    this.productName = entity.productName;
    this.source = entity.source;
    this.occurrenceCount = entity.occurrenceCount;
  }
}
