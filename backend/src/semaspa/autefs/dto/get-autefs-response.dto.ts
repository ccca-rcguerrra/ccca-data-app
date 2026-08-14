import { ApiProperty } from '@nestjs/swagger';
import { AutefResponseDto } from './autef-response.dto';
import { buildPaginatedResponse } from '../../shared/semaspa-pagination.dto';

export class GetAutefsResponseDto {
  @ApiProperty({ type: [AutefResponseDto] })
  data: AutefResponseDto[];

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNext: boolean;

  @ApiProperty({ example: false })
  hasPrev: boolean;

  constructor(data: AutefResponseDto[], page: number, limit: number, total: number) {
    Object.assign(this, buildPaginatedResponse(data, page, limit, total));
  }
}
