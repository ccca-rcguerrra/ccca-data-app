import { ApiProperty } from '@nestjs/swagger';
import { SemaspaForestGuideSpecies } from '../../model/entities/semaspa-forest-guide-species.view.entity';

export class ForestGuideSpeciesResponseDto {
  @ApiProperty({ description: 'Surrogate key' })
  id: string;

  @ApiProperty({ description: 'Forest guide ID' })
  forestGuideId: number;

  @ApiProperty({ description: 'Species-product ID' })
  speciesProductId: string;

  @ApiProperty({ description: 'Transported volume', nullable: true })
  volume: number | null;

  @ApiProperty({ description: 'Unit of measure', nullable: true })
  unit: string | null;

  @ApiProperty({ description: 'Declared value', nullable: true })
  value: number | null;

  constructor(entity: SemaspaForestGuideSpecies) {
    this.id = entity.id;
    this.forestGuideId = entity.forestGuideId;
    this.speciesProductId = entity.speciesProductId;
    this.volume = entity.volume;
    this.unit = entity.unit;
    this.value = entity.value;
  }
}
