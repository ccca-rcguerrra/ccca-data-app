import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export class GetSpeciesProductsQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by scientific, common or product name',
    example: 'Macaranduba',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by source',
    example: 'AUTEF',
    enum: ['AUTEF', 'GF'],
  })
  @IsOptional()
  @IsString()
  source?: string;
}
