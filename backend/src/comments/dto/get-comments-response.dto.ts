import { ApiProperty } from '@nestjs/swagger';
import { CommentResponseDto } from './comment-response.dto';

export class GetCommentsResponseDto {
  @ApiProperty({ description: 'Array of comments', type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty({ description: 'Current page number', example: 1, type: Number })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20, type: Number })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 42, type: Number })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 3, type: Number })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true, type: Boolean })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false, type: Boolean })
  hasPrev: boolean;

  constructor(data: CommentResponseDto[], page: number, limit: number, total: number) {
    this.data = data;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
