import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export const PERSON_AUTEF_OCCURRENCE_FLAGS = [
  'over_extracted',
  'unit_conflict',
  'credit_use_over_90',
] as const;

export const PERSON_GF_OCCURRENCE_FLAGS = [
  'destination_over_extracted',
  'associated_plates',
] as const;

export type PersonAutefOccurrenceFlag =
  (typeof PERSON_AUTEF_OCCURRENCE_FLAGS)[number];

export type PersonGfOccurrenceFlag =
  (typeof PERSON_GF_OCCURRENCE_FLAGS)[number];

export class GetPersonLinkedAutefsQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    enum: PERSON_AUTEF_OCCURRENCE_FLAGS,
    description: 'Restrict to AUTEFs matching an investigative occurrence',
  })
  @IsOptional()
  @IsString()
  @IsIn([...PERSON_AUTEF_OCCURRENCE_FLAGS])
  flag?: PersonAutefOccurrenceFlag;
}

export class GetPersonLinkedForestGuidesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    enum: PERSON_GF_OCCURRENCE_FLAGS,
    description: 'Restrict to forest guides matching an investigative occurrence',
  })
  @IsOptional()
  @IsString()
  @IsIn([...PERSON_GF_OCCURRENCE_FLAGS])
  flag?: PersonGfOccurrenceFlag;
}
