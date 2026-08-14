import { ApiProperty } from '@nestjs/swagger';
import { SemaspaAutefSpecies } from '../../model/entities/semaspa-autef-species.view.entity';

export class AutefSpeciesResponseDto {
  @ApiProperty({ description: 'Surrogate key' })
  id: string;

  @ApiProperty({ description: 'AUTEF ID' })
  autefId: number;

  @ApiProperty({ description: 'Species-product ID' })
  speciesProductId: string;

  @ApiProperty({ description: 'Authorized volume', nullable: true })
  volume: number | null;

  @ApiProperty({ description: 'Unit of measure', nullable: true })
  unit: string | null;

  constructor(entity: SemaspaAutefSpecies) {
    this.id = entity.id;
    this.autefId = entity.autefId;
    this.speciesProductId = entity.speciesProductId;
    this.volume = entity.volume;
    this.unit = entity.unit;
  }
}
