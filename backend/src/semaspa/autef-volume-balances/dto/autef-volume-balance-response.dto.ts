import { ApiProperty } from '@nestjs/swagger';
import { SemaspaAutefVolumeBalance } from '../../../model/entities/semaspa-autef-volume-balance.view.entity';

export class AutefVolumeBalanceResponseDto {
  @ApiProperty({ description: 'Surrogate key' })
  id: string;

  @ApiProperty({ description: 'AUTEF ID' })
  autefId: number;

  @ApiProperty({ description: 'Species-product ID' })
  speciesProductId: string;

  @ApiProperty({ description: 'Authorized volume', nullable: true })
  authorizedVolume: number | null;

  @ApiProperty({ description: 'Authorized unit', nullable: true })
  authorizedUnit: string | null;

  @ApiProperty({ description: 'Authorized unit count', nullable: true })
  authorizedUnitCount: number | null;

  @ApiProperty({ description: 'Moved volume', nullable: true })
  movedVolume: number | null;

  @ApiProperty({ description: 'Moved unit', nullable: true })
  movedUnit: string | null;

  @ApiProperty({ description: 'Moved unit count', nullable: true })
  movedUnitCount: number | null;

  @ApiProperty({
    description: 'Ratio of moved to authorized volume (0 to 1 scale)',
    nullable: true,
  })
  movedRatio: number | null;

  @ApiProperty({ description: 'Excess volume', nullable: true })
  excessVolume: number | null;

  @ApiProperty({ description: 'Whether over-extracted' })
  isOverExtracted: boolean;

  @ApiProperty({ description: 'Whether unit conflict exists' })
  hasUnitConflict: boolean;

  constructor(entity: SemaspaAutefVolumeBalance) {
    this.id = entity.id;
    this.autefId = entity.autefId;
    this.speciesProductId = entity.speciesProductId;
    this.authorizedVolume = entity.authorizedVolume;
    this.authorizedUnit = entity.authorizedUnit;
    this.authorizedUnitCount = entity.authorizedUnitCount;
    this.movedVolume = entity.movedVolume;
    this.movedUnit = entity.movedUnit;
    this.movedUnitCount = entity.movedUnitCount;
    this.movedRatio = entity.movedRatio;
    this.excessVolume = entity.excessVolume;
    this.isOverExtracted = entity.isOverExtracted;
    this.hasUnitConflict = entity.hasUnitConflict;
  }
}
