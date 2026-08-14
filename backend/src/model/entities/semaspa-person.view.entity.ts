import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_people',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaPerson {
  @ApiProperty({
    description: 'Person ID (hash of tax ID)',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({
    description: 'Tax ID (CPF/CNPJ)',
    example: '12345678901',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'tax_id' })
  taxId: string | null;

  @ApiProperty({
    description: 'Known names for this person',
    example: ['JOAO SILVA'],
    type: [String],
    nullable: true,
  })
  @ViewColumn({ name: 'names' })
  names: string[] | null;

  @ApiProperty({
    description: 'Role types across sources',
    example: ['Proprietario AUTEF', 'Ator GF'],
    type: [String],
    nullable: true,
  })
  @ViewColumn({ name: 'role_types' })
  roleTypes: string[] | null;

  @ApiProperty({
    description: 'Data sources',
    example: ['AUTEF', 'GF'],
    type: [String],
    nullable: true,
  })
  @ViewColumn({ name: 'sources' })
  sources: string[] | null;

  @ApiProperty({
    description: 'State registration (inscricao estadual)',
    example: '123456789',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'state_registration' })
  stateRegistration: string | null;

  @ApiProperty({
    description: 'CEPROF-PA registration',
    example: 'CEPROF-123',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'ceprof_registration' })
  ceprofRegistration: string | null;

  @ApiProperty({
    description: 'CTF registration',
    example: 'CTF-123',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'ctf_registration' })
  ctfRegistration: string | null;

  @ApiProperty({
    description: 'Address',
    example: 'Rua Exemplo, 100',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'address' })
  address: string | null;

  @ApiProperty({
    description: 'District',
    example: 'Centro',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'district' })
  district: string | null;

  @ApiProperty({
    description: 'Postal code',
    example: '68000-000',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'postal_code' })
  postalCode: string | null;

  @ApiProperty({
    description: 'City',
    example: 'Santarem',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'city' })
  city: string | null;

  @ApiProperty({
    description: 'State',
    example: 'PA',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'state' })
  state: string | null;

  @ApiProperty({
    description: 'Country',
    example: 'Brasil',
    type: String,
    nullable: true,
  })
  @ViewColumn({ name: 'country' })
  country: string | null;

  @ApiProperty({
    description: 'Total occurrences across sources',
    example: 3,
    type: Number,
    nullable: true,
  })
  @ViewColumn({ name: 'occurrence_count' })
  occurrenceCount: number | null;
}
