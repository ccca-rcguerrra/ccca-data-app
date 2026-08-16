import { ApiProperty } from '@nestjs/swagger';

export class VolumeBalanceForestGuideResponseDto {
  @ApiProperty({ description: 'Forest guide ID' })
  forestGuideId: number;

  @ApiProperty({ description: 'Forest guide number', nullable: true })
  number: string | null;

  @ApiProperty({ description: 'Issue date', nullable: true })
  issuedAt: Date | string | null;

  @ApiProperty({ description: 'Status', nullable: true })
  status: string | null;

  @ApiProperty({ description: 'Type (always GF1 for this endpoint)', nullable: true })
  type: string | null;

  @ApiProperty({ description: 'Volume of this species-product on the GF', nullable: true })
  volume: number | null;

  @ApiProperty({ description: 'Unit of the species-product volume', nullable: true })
  unit: string | null;

  @ApiProperty({ description: 'Species-product ID' })
  speciesProductId: string;

  @ApiProperty({
    description: 'Cumulative species-product volume up to and including this GF (chronological)',
  })
  runningTotal: number;
}
