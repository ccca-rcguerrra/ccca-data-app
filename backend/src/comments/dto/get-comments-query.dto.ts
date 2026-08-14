import { IsOptional, IsInt, Min, Max, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetCommentsQueryDto {
  @ApiProperty({
    description: 'Channel to list comments from (e.g. "alert:123")',
    example: 'alert:123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  channel: string;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    type: Number,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
