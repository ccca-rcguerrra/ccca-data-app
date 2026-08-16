import { ApiProperty } from '@nestjs/swagger';
import { ForestGuideResponseDto } from '../../forest-guides/dto/forest-guide-response.dto';

export class PersonLinkedForestGuideResponseDto {
  @ApiProperty({
    description: 'Role on this forest guide',
    enum: ['ORIGEM_GF', 'DESTINO_GF'],
  })
  role: string;

  @ApiProperty({ description: 'Data source', enum: ['AUTEF', 'GF'] })
  source: string;

  @ApiProperty({ type: ForestGuideResponseDto })
  forestGuide: ForestGuideResponseDto;
}
