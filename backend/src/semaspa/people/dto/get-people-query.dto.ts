import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export class GetPeopleQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by names, tax ID or city (partial, case-insensitive)',
    example: 'SILVA',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
