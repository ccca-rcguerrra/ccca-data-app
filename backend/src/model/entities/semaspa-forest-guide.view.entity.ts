import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_forest_guides',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaForestGuide {
  @ApiProperty({
    description: 'Forest guide ID',
    example: 1,
    type: Number,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'int4',
  })
  id: number;

  @ApiProperty({
    description: 'Forest guide number',
    example: 'GF-2024-001',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'number' })
  number: string | null;

  @ApiProperty({
    description: 'Issue date',
    example: '2024-01-15T00:00:00.000Z',
    type: Date,
    nullable: true,
  })
  @ViewColumn({ name: 'issued_at' })
  issuedAt: Date | null;

  @ApiProperty({
    description: 'Status',
    example: 'ATIVO',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'status' })
  status: string | null;

  @ApiProperty({
    description: 'Type',
    example: 'GF1',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'type' })
  type: string | null;

  @ApiProperty({
    description: 'Permit references (AUTEF refs)',
    example: ['20139/2024'],
    type: [String],
    nullable: true,
  })
  @ViewColumn({ name: 'permit_refs' })
  permitRefs: string[] | null;

  @ApiProperty({
    description: 'Vehicle plates',
    example: ['ABC1D23'],
    type: [String],
    nullable: true,
  })
  @ViewColumn({ name: 'vehicle_plates' })
  vehiclePlates: string[] | null;
}
