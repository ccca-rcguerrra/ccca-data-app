import {
  IsString,
  IsNotEmpty,
  MaxLength,
  Matches,
  IsOptional,
  IsArray,
  IsInt,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Channel the comment belongs to (e.g. "alert:123")',
    example: 'alert:123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Matches(/^[a-z]+:\d+$/, {
    message: 'channel must follow the "<resource>:<id>" format (e.g. "alert:123")',
  })
  channel: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'Geometria revisada, pronta para auditoria.',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    description: 'IDs of users mentioned in the comment (with @)',
    example: [2, 5],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  mentionedUserIds?: number[];
}
