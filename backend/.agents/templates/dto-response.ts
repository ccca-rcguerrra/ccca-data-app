import { ApiProperty } from '@nestjs/swagger';
import type { DomainEntity } from '../../model/entities/domain.entity';

export class DomainResponseDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Item name', example: 'Example Item' })
  name: string;

  @ApiProperty({ description: 'Item description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  constructor(entity: DomainEntity) {
    this.id = entity.id;
    this.name = entity.name;
    this.description = entity.description ?? null;
    this.createdAt = entity.createdAt;
    this.updatedAt = entity.updatedAt;
  }
}

export class GetDomainsResponseDto {
  @ApiProperty({ type: [DomainResponseDto] })
  data: DomainResponseDto[];

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

  constructor(
    data: DomainResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.data = data;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page * limit < total;
    this.hasPrev = page > 1;
  }
}
