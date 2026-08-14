import { ApiProperty } from '@nestjs/swagger';
import { buildPaginatedResponse } from './semaspa-pagination.dto';
import { AutefSpeciesResponseDto } from './autef-species-response.dto';
import { ForestGuideSpeciesResponseDto } from './forest-guide-species-response.dto';
import { PersonRoleResponseDto } from './person-role-response.dto';
import { ForestGuideResponseDto } from '../forest-guides/dto/forest-guide-response.dto';
import { HarvestUnitResponseDto } from '../harvest-units/dto/harvest-unit-response.dto';
import { AutefVolumeBalanceResponseDto } from '../autef-volume-balances/dto/autef-volume-balance-response.dto';
import { PersonResponseDto } from '../people/dto/person-response.dto';
import { SpeciesProductResponseDto } from '../species-products/dto/species-product-response.dto';

abstract class PaginatedBase {
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

  protected assignPagination(page: number, limit: number, total: number) {
    const { page: p, limit: l, total: t, totalPages, hasNext, hasPrev } =
      buildPaginatedResponse([], page, limit, total);
    this.page = p;
    this.limit = l;
    this.total = t;
    this.totalPages = totalPages;
    this.hasNext = hasNext;
    this.hasPrev = hasPrev;
  }
}

export class GetAutefSpeciesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [AutefSpeciesResponseDto] })
  data: AutefSpeciesResponseDto[];

  constructor(data: AutefSpeciesResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetForestGuideSpeciesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [ForestGuideSpeciesResponseDto] })
  data: ForestGuideSpeciesResponseDto[];

  constructor(data: ForestGuideSpeciesResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetPersonRolesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [PersonRoleResponseDto] })
  data: PersonRoleResponseDto[];

  constructor(data: PersonRoleResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetForestGuidesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [ForestGuideResponseDto] })
  data: ForestGuideResponseDto[];

  constructor(data: ForestGuideResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetHarvestUnitsResponseDto extends PaginatedBase {
  @ApiProperty({ type: [HarvestUnitResponseDto] })
  data: HarvestUnitResponseDto[];

  constructor(data: HarvestUnitResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetAutefVolumeBalancesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [AutefVolumeBalanceResponseDto] })
  data: AutefVolumeBalanceResponseDto[];

  constructor(data: AutefVolumeBalanceResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetPeopleResponseDto extends PaginatedBase {
  @ApiProperty({ type: [PersonResponseDto] })
  data: PersonResponseDto[];

  constructor(data: PersonResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetSpeciesProductsResponseDto extends PaginatedBase {
  @ApiProperty({ type: [SpeciesProductResponseDto] })
  data: SpeciesProductResponseDto[];

  constructor(data: SpeciesProductResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}
