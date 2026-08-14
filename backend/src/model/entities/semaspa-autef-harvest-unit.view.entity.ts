import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_autef_harvest_units',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaAutefHarvestUnit {
  @ApiProperty({
    description: 'Surrogate key of autef_id + harvest_unit_id',
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
    description: 'Harvest unit (UPA) ID',
    example: 5,
    type: Number,
  })
  @ViewColumn({ name: 'harvest_unit_id' })
  harvestUnitId: number;
}
