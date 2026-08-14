import { ViewEntity, ViewColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@ViewEntity({
  name: 'semaspa_person_roles',
  schema: 'public_app',
  synchronize: false,
})
export class SemaspaPersonRole {
  @ApiProperty({
    description: 'Surrogate key of entity_type + entity_id + person_id + role',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @PrimaryColumn({
    name: 'id',
    type: 'text',
  })
  id: string;

  @ApiProperty({
    description: 'Entity type',
    example: 'AUTEF',
    enum: ['AUTEF', 'GF'],
  })
  @ViewColumn({ name: 'entity_type' })
  entityType: string;

  @ApiProperty({
    description: 'Entity ID (AUTEF or forest guide)',
    example: 1,
    type: Number,
  })
  @ViewColumn({ name: 'entity_id' })
  entityId: number;

  @ApiProperty({
    description: 'Person ID',
    example: 'a1b2c3d4e5f6',
    type: String,
  })
  @ViewColumn({ name: 'person_id' })
  personId: string;

  @ApiProperty({
    description: 'Role',
    example: 'PROPRIETARIO',
    enum: ['ANALISTA', 'PROPRIETARIO', 'RESPONSAVEL_TECNICO', 'ORIGEM_GF', 'DESTINO_GF'],
  })
  @ViewColumn({ name: 'role' })
  role: string;

  @ApiProperty({
    description: 'Data source',
    example: 'AUTEF',
    enum: ['AUTEF', 'GF'],
  })
  @ViewColumn({ name: 'source' })
  source: string;
}
