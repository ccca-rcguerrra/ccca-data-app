import { ApiProperty } from '@nestjs/swagger';

export class PersonParticipationResponseDto {
  @ApiProperty({ description: 'Distinct AUTEFs where the person is owner' })
  ownerAutefCount: number;

  @ApiProperty({ description: 'Distinct AUTEFs where the person is technical responsible' })
  technicalResponsibleAutefCount: number;

  @ApiProperty({ description: 'Distinct AUTEFs where the person is analyst' })
  analystAutefCount: number;

  @ApiProperty({ description: 'Distinct GFs where the person is origin' })
  originGfCount: number;

  @ApiProperty({ description: 'Distinct GFs where the person is destination' })
  destinationGfCount: number;

  @ApiProperty({ description: 'Distinct AUTEFs linked in any role' })
  distinctAutefCount: number;

  @ApiProperty({ description: 'Distinct GFs linked in any role' })
  distinctGfCount: number;

  @ApiProperty({
    description:
      'Distinct over-extracted AUTEFs where the person is owner or technical responsible',
  })
  overExtractedAutefCount: number;

  @ApiProperty({
    description:
      'Distinct unit-conflict AUTEFs where the person is owner or technical responsible',
  })
  unitConflictAutefCount: number;

  @ApiProperty({
    description:
      'Distinct AUTEFs with credit use >= 90% where the person is owner or technical responsible',
  })
  creditUseOver90AutefCount: number;

  @ApiProperty({
    description:
      'Distinct GFs as DESTINO_GF linked to over-extracted AUTEFs',
  })
  recurrentDestinationGfCount: number;

  @ApiProperty({
    description:
      'Distinct vehicle plates on the person GFs that are linked to over-extracted AUTEFs',
  })
  associatedPlateCount: number;

  @ApiProperty({
    nullable: true,
    description:
      'The plate value when associatedPlateCount is 1; otherwise null',
  })
  associatedPlateSample: string | null;
}
