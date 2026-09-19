import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export const PERMIT_REFERENCE_MATCH_STATUSES = [
  'unparseable',
  'unmatched',
  'matched',
  'ambiguous',
] as const;

export type PermitReferenceMatchStatus =
  (typeof PERMIT_REFERENCE_MATCH_STATUSES)[number];

@ViewEntity({
  name: 'semaspa_forest_guide_permit_references',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaForestGuidePermitReference {
  @ApiProperty({
    description: 'Surrogate key of forest_guide_id + raw_reference',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({ description: 'Forest guide ID', example: 10, type: Number })
  @ViewColumn({ name: 'forest_guide_id' })
  forestGuideId: number;

  @ApiProperty({
    description: 'Original AUTEF reference text declared on the forest guide',
    example: '20139/2024',
  })
  @ViewColumn({ name: 'raw_reference' })
  rawReference: string;

  @ApiProperty({ nullable: true, example: '20139' })
  @ViewColumn({ name: 'parsed_number' })
  parsedNumber: string | null;

  @ApiProperty({ nullable: true, example: '2024' })
  @ViewColumn({ name: 'parsed_year' })
  parsedYear: string | null;

  @ApiProperty({
    enum: PERMIT_REFERENCE_MATCH_STATUSES,
    example: 'unmatched',
  })
  @ViewColumn({ name: 'match_status' })
  matchStatus: PermitReferenceMatchStatus;

  @ApiProperty({ nullable: true, example: 497, type: Number })
  @ViewColumn({ name: 'autef_id' })
  autefId: number | null;
}
