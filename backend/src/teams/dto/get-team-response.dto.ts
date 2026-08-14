import { ApiProperty } from '@nestjs/swagger';
import { TerritoryDto } from '../../users/dto/territory.dto';
import { UserDto } from './user.dto';

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

  @ApiProperty({
    description: 'Users associated with the team',
    type: [UserDto],
  })
  users: UserDto[];

  @ApiProperty({
    description: 'Number of users in the team',
    example: 5,
    type: Number,
  })
  usersCount: number;
}

export class GetTeamResponseDto {
  @ApiProperty({
    description: 'Team data',
    type: TeamDto,
  })
  data: TeamDto;

  constructor(data: TeamDto) {
    this.data = data;
  }
}

