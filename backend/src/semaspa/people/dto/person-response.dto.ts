import { ApiProperty } from '@nestjs/swagger';
import { SemaspaPerson } from '../../../model/entities/semaspa-person.view.entity';

export class PersonResponseDto {
  @ApiProperty({ description: 'Person ID', example: 'a1b2c3d4e5f6' })
  id: string;

  @ApiProperty({ description: 'Tax ID (CPF/CNPJ)', nullable: true })
  taxId: string | null;

  @ApiProperty({ description: 'Known names', type: [String], nullable: true })
  names: string[] | null;

  @ApiProperty({ description: 'Role types', type: [String], nullable: true })
  roleTypes: string[] | null;

  @ApiProperty({ description: 'Data sources', type: [String], nullable: true })
  sources: string[] | null;

  @ApiProperty({ description: 'State registration', nullable: true })
  stateRegistration: string | null;

  @ApiProperty({ description: 'CEPROF-PA registration', nullable: true })
  ceprofRegistration: string | null;

  @ApiProperty({ description: 'CTF registration', nullable: true })
  ctfRegistration: string | null;

  @ApiProperty({ description: 'Address', nullable: true })
  address: string | null;

  @ApiProperty({ description: 'District', nullable: true })
  district: string | null;

  @ApiProperty({ description: 'Postal code', nullable: true })
  postalCode: string | null;

  @ApiProperty({ description: 'City', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'State', nullable: true })
  state: string | null;

  @ApiProperty({ description: 'Country', nullable: true })
  country: string | null;

  @ApiProperty({ description: 'Occurrence count', nullable: true })
  occurrenceCount: number | null;

  constructor(entity: SemaspaPerson) {
    this.id = entity.id;
    this.taxId = entity.taxId;
    this.names = entity.names;
    this.roleTypes = entity.roleTypes;
    this.sources = entity.sources;
    this.stateRegistration = entity.stateRegistration;
    this.ceprofRegistration = entity.ceprofRegistration;
    this.ctfRegistration = entity.ctfRegistration;
    this.address = entity.address;
    this.district = entity.district;
    this.postalCode = entity.postalCode;
    this.city = entity.city;
    this.state = entity.state;
    this.country = entity.country;
    this.occurrenceCount = entity.occurrenceCount;
  }
}
