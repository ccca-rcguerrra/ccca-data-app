import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_autef_forest_guides',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaAutefForestGuide {
  @ApiProperty({
    description: 'Surrogate key of autef_id + forest_guide_id',
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
    description: 'Forest guide ID',
    example: 10,
    type: Number,
  })
  @ViewColumn({ name: 'forest_guide_id' })
  forestGuideId: number;
}
