import { IsNotEmpty, IsOptional, IsString, IsInt, MaxLength, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Team name',
    example: 'Team Alpha',
    type: String,
    maxLength: 500,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  name: string;

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

  @ApiProperty({
    description: 'User IDs to add to the team',
    example: [1, 2, 3],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value;
    }
    return [value];
  })
  @IsArray()
  @IsInt({ each: true })
  userIds?: number[];
}

