import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_autef_volume_balances',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaAutefVolumeBalance {
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
  @ViewColumn({ name: 'authorized_volume' })
  authorizedVolume: number | null;

  @ApiProperty({
    description: 'Authorized unit of measure',
    example: 'M3',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'authorized_unit' })
  authorizedUnit: string | null;

  @ApiProperty({
    description: 'Count of distinct authorized units',
    example: 1,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'authorized_unit_count' })
  authorizedUnitCount: number | null;

  @ApiProperty({
    description: 'Total moved volume',
    example: 160.0,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'moved_volume' })
  movedVolume: number | null;

  @ApiProperty({
    description: 'Moved unit of measure',
    example: 'M3',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'moved_unit' })
  movedUnit: string | null;

  @ApiProperty({
    description: 'Count of distinct moved units',
    example: 1,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'moved_unit_count' })
  movedUnitCount: number | null;

  @ApiProperty({
    description: 'Ratio of moved to authorized volume (0 to 1 scale)',
    example: 1.06,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'moved_ratio' })
  movedRatio: number | null;

  @ApiProperty({
    description: 'Excess volume above authorized',
    example: 9.5,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'excess_volume' })
  excessVolume: number | null;

  @ApiProperty({
    description: 'Whether moved volume exceeds authorized volume',
    example: true,
    type: Boolean,
  })
  @ViewColumn({ name: 'is_over_extracted' })
  isOverExtracted: boolean;

  @ApiProperty({
    description: 'Whether there is a unit-of-measure conflict',
    example: false,
    type: Boolean,
  })
  @ViewColumn({ name: 'has_unit_conflict' })
  hasUnitConflict: boolean;
}
