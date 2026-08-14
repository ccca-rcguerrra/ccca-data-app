import { ApiProperty } from '@nestjs/swagger';

export class TerritoryDto {
  @ApiProperty({
    description: 'Unique territory ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Territory version',
    example: 1,
    type: Number,
  })
  version: number;

  @ApiProperty({
    description: 'Territory name',
    example: 'Amazonas',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Territory category',
    example: 'state',
    type: String,
  })
  category: string;

  @ApiProperty({
    description: 'Territory category name (human friendly)',
    example: 'State',
    type: String,
    nullable: true,
    required: false,
  })
  categoryName: string | null;

  @ApiProperty({
    description: 'Territory source',
    example: 'ibge',
    type: String,
  })
  source: string;

  @ApiProperty({
    description: 'Territory area in hectares',
    example: 1570000.5,
    type: Number,
    nullable: true,
    required: false,
  })
  areaHa: number | null;

  @ApiProperty({
    description: 'Whether territory is enabled',
    example: true,
    type: Boolean,
  })
  enabled: boolean;
}

