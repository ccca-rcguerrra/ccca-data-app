import { ApiProperty } from '@nestjs/swagger';
import { AutefResponseDto } from '../../autefs/dto/autef-response.dto';

export class PersonLinkedAutefResponseDto {
  @ApiProperty({
    description: 'Role on this AUTEF',
    enum: ['ANALISTA', 'PROPRIETARIO', 'RESPONSAVEL_TECNICO'],
  })
  role: string;

  @ApiProperty({ description: 'Data source', enum: ['AUTEF', 'GF'] })
  source: string;

  @ApiProperty({ type: AutefResponseDto })
  autef: AutefResponseDto;
}
