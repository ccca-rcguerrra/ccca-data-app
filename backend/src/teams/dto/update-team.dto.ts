import { IsOptional, IsString, IsInt, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTeamDto {
  @ApiProperty({
    description: 'Team name',
    example: 'Team Alpha',
    type: String,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @ApiProperty({
    description: 'Territory ID associated with the team',
    example: 1,
    type: Number,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsInt()
  territoryId?: number;
}





