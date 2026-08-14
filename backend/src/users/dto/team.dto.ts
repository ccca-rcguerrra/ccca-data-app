import { ApiProperty } from '@nestjs/swagger';
import { TerritoryDto } from './territory.dto';

export class TeamDto {
  @ApiProperty({
    description: 'Unique team ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Team name',
    example: 'Team Alpha',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Territory ID associated with the team',
    example: 1,
    type: Number,
    nullable: true,
    required: false,
  })
  territoryId: number | null;

  @ApiProperty({
    description: 'Team creation date',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date of last team update',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Territory associated with the team',
    type: TerritoryDto,
    nullable: true,
    required: false,
  })
  territory: TerritoryDto | null;
}

