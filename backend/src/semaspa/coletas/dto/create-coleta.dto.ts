import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateColetaDto {
  @ApiProperty({ enum: ['autef', 'gf'], example: 'autef' })
  @IsIn(['autef', 'gf'])
  base: 'autef' | 'gf';

  @ApiPropertyOptional({
    type: Object,
    description:
      'Filtros da busca (ex.: AUTEF: { ano }; GF: { data_inicio, data_fim }).',
    example: { ano: 2024 },
  })
  @IsOptional()
  @IsObject()
  filtros?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 1, description: 'Página inicial da busca' })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageStart?: number;

  @ApiPropertyOptional({
    example: null,
    description: 'Página final da busca (null = até o fim)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  pageEnd?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Ignora progresso salvo e reinicia a busca',
  })
  @IsOptional()
  @IsBoolean()
  forceRestart?: boolean;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum number of documents to collect. Empty collects the whole period.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
