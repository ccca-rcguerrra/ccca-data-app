import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

export class GetVolumeBalanceForestGuidesQueryDto extends SemaspaPaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Items per page',
    example: 100,
    minimum: 1,
    maximum: 100,
    default: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 100;
}
