import { ApiProperty } from '@nestjs/swagger';
import { buildPaginatedResponse } from './semaspa-pagination.dto';
import { AutefSpeciesResponseDto } from './autef-species-response.dto';
import { ForestGuideSpeciesResponseDto } from './forest-guide-species-response.dto';
import { PersonRoleResponseDto } from './person-role-response.dto';
import { ForestGuideResponseDto } from '../forest-guides/dto/forest-guide-response.dto';
import { HarvestUnitResponseDto } from '../harvest-units/dto/harvest-unit-response.dto';
import { AutefVolumeBalanceResponseDto } from '../autef-volume-balances/dto/autef-volume-balance-response.dto';
import { VolumeBalanceForestGuideResponseDto } from '../autefs/dto/volume-balance-forest-guide-response.dto';
import { PersonResponseDto } from '../people/dto/person-response.dto';
import { PersonLinkedAutefResponseDto } from '../people/dto/person-linked-autef-response.dto';
import { PersonLinkedForestGuideResponseDto } from '../people/dto/person-linked-forest-guide-response.dto';
import { AutefPlateResponseDto } from '../autefs/dto/autef-plate-response.dto';
import { AutefRelatedResponseDto } from '../autefs/dto/autef-related-response.dto';
import { PermitReferenceResponseDto } from '../permit-references/dto/permit-reference-response.dto';
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

export class GetVolumeBalanceForestGuidesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [VolumeBalanceForestGuideResponseDto] })
  data: VolumeBalanceForestGuideResponseDto[];

  @ApiProperty({
    description: 'Sum of matching GF species volumes (all pages, not only the current page)',
    nullable: true,
  })
  movedVolumeSum: number | null;

  @ApiProperty({
    description:
      'First GF in chronological order whose running total exceeds authorized volume',
    nullable: true,
  })
  crossingForestGuideId: number | null;

  constructor(
    data: VolumeBalanceForestGuideResponseDto[],
    page: number,
    limit: number,
    total: number,
    movedVolumeSum: number | null,
    crossingForestGuideId: number | null,
  ) {
    super();
    this.data = data;
    this.movedVolumeSum = movedVolumeSum;
    this.crossingForestGuideId = crossingForestGuideId;
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

export class GetPersonLinkedAutefsResponseDto extends PaginatedBase {
  @ApiProperty({ type: [PersonLinkedAutefResponseDto] })
  data: PersonLinkedAutefResponseDto[];

  constructor(
    data: PersonLinkedAutefResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetPersonLinkedForestGuidesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [PersonLinkedForestGuideResponseDto] })
  data: PersonLinkedForestGuideResponseDto[];

  constructor(
    data: PersonLinkedForestGuideResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
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

export class GetAutefPlatesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [AutefPlateResponseDto] })
  data: AutefPlateResponseDto[];

  constructor(data: AutefPlateResponseDto[], page: number, limit: number, total: number) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}

export class GetAutefRelatedResponseDto {
  @ApiProperty({ type: [AutefRelatedResponseDto] })
  data: AutefRelatedResponseDto[];

  constructor(data: AutefRelatedResponseDto[]) {
    this.data = data;
  }
}

export class GetPermitReferencesResponseDto extends PaginatedBase {
  @ApiProperty({ type: [PermitReferenceResponseDto] })
  data: PermitReferenceResponseDto[];

  constructor(
    data: PermitReferenceResponseDto[],
    page: number,
    limit: number,
    total: number,
  ) {
    super();
    this.data = data;
    this.assignPagination(page, limit, total);
  }
}
