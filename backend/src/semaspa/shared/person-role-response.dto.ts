import { ApiProperty } from '@nestjs/swagger';
import { SemaspaPersonRole } from '../../model/entities/semaspa-person-role.view.entity';

export class PersonRoleResponseDto {
  @ApiProperty({ description: 'Surrogate key' })
  id: string;

  @ApiProperty({ description: 'Entity type', enum: ['AUTEF', 'GF'] })
  entityType: string;

  @ApiProperty({ description: 'Entity ID' })
  entityId: number;

  @ApiProperty({ description: 'Person ID' })
  personId: string;

  @ApiProperty({
    description: 'Role',
    enum: ['ANALISTA', 'PROPRIETARIO', 'RESPONSAVEL_TECNICO', 'ORIGEM_GF', 'DESTINO_GF'],
  })
  role: string;

  @ApiProperty({ description: 'Data source', enum: ['AUTEF', 'GF'] })
  source: string;

  constructor(entity: SemaspaPersonRole) {
    this.id = entity.id;
    this.entityType = entity.entityType;
    this.entityId = entity.entityId;
    this.personId = entity.personId;
    this.role = entity.role;
    this.source = entity.source;
  }
}
