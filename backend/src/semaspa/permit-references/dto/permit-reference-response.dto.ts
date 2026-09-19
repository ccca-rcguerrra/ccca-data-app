import { ApiProperty } from '@nestjs/swagger';
import type { PermitReferenceMatchStatus } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';
import { PERMIT_REFERENCE_MATCH_STATUSES } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';

export class PermitReferenceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 10 })
  forestGuideId: number;

  @ApiProperty({ nullable: true })
  forestGuideNumber: string | null;

  @ApiProperty({ nullable: true })
  type: string | null;

  @ApiProperty({ nullable: true })
  issuedAt: Date | string | null;

  @ApiProperty({ example: '20139/2024' })
  rawReference: string;

  @ApiProperty({ nullable: true })
  parsedNumber: string | null;

  @ApiProperty({ nullable: true })
  parsedYear: string | null;

  @ApiProperty({ enum: PERMIT_REFERENCE_MATCH_STATUSES })
  matchStatus: PermitReferenceMatchStatus;

  @ApiProperty({ nullable: true, example: 497 })
  autefId: number | null;

  @ApiProperty({ nullable: true })
  autefNumber: string | null;
}
