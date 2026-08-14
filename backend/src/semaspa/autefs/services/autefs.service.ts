import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import { SemaspaAutefSpecies } from '../../../model/entities/semaspa-autef-species.view.entity';
import { SemaspaAutefVolumeBalance } from '../../../model/entities/semaspa-autef-volume-balance.view.entity';
import { SemaspaAutefForestGuide } from '../../../model/entities/semaspa-autef-forest-guide.view.entity';
import { SemaspaAutefHarvestUnit } from '../../../model/entities/semaspa-autef-harvest-unit.view.entity';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';
import { SemaspaHarvestUnit } from '../../../model/entities/semaspa-harvest-unit.view.entity';
import { SemaspaPersonRole } from '../../../model/entities/semaspa-person-role.view.entity';
import { AUTEF_SORT_FIELDS, GetAutefsQueryDto } from '../dto/get-autefs-query.dto';
import { AutefResponseDto } from '../dto/autef-response.dto';
import { GetAutefsResponseDto } from '../dto/get-autefs-response.dto';
import { AutefSpeciesResponseDto } from '../../shared/autef-species-response.dto';
import { AutefVolumeBalanceResponseDto } from '../../autef-volume-balances/dto/autef-volume-balance-response.dto';
import { ForestGuideResponseDto } from '../../forest-guides/dto/forest-guide-response.dto';
import { HarvestUnitResponseDto } from '../../harvest-units/dto/harvest-unit-response.dto';
import { PersonRoleResponseDto } from '../../shared/person-role-response.dto';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';
import {
  GetAutefSpeciesResponseDto,
  GetAutefVolumeBalancesResponseDto,
  GetForestGuidesResponseDto,
  GetHarvestUnitsResponseDto,
  GetPersonRolesResponseDto,
} from '../../shared/paginated-responses.dto';

@Injectable()
export class AutefsService {
  constructor(
    @InjectRepository(SemaspaAutef)
    private readonly autefRepo: Repository<SemaspaAutef>,
    @InjectRepository(SemaspaAutefSpecies)
    private readonly autefSpeciesRepo: Repository<SemaspaAutefSpecies>,
    @InjectRepository(SemaspaAutefVolumeBalance)
    private readonly volumeBalanceRepo: Repository<SemaspaAutefVolumeBalance>,
    @InjectRepository(SemaspaAutefForestGuide)
    private readonly autefForestGuideRepo: Repository<SemaspaAutefForestGuide>,
    @InjectRepository(SemaspaAutefHarvestUnit)
    private readonly autefHarvestUnitRepo: Repository<SemaspaAutefHarvestUnit>,
    @InjectRepository(SemaspaForestGuide)
    private readonly forestGuideRepo: Repository<SemaspaForestGuide>,
    @InjectRepository(SemaspaHarvestUnit)
    private readonly harvestUnitRepo: Repository<SemaspaHarvestUnit>,
    @InjectRepository(SemaspaPersonRole)
    private readonly personRoleRepo: Repository<SemaspaPersonRole>,
  ) {}

  private static toBbox(raw: Record<string, unknown> | undefined): [number, number, number, number] | null {
    if (!raw) return null;
    const w = Number(raw.bbox_w);
    const s = Number(raw.bbox_s);
    const e = Number(raw.bbox_e);
    const n = Number(raw.bbox_n);
    if ([w, s, e, n].some((v) => !Number.isFinite(v))) return null;
    return [w, s, e, n];
  }

  private async assertAutefExists(id: number): Promise<void> {
    const exists = await this.autefRepo.exist({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`AUTEF ${id} not found`);
    }
  }

  private applyAutefListFilters(
    qb: SelectQueryBuilder<SemaspaAutef>,
    query: GetAutefsQueryDto,
  ): void {
    const {
      search,
      city,
      state,
      issueYear,
      issueMonth,
      processNumber,
      issuedFrom,
      issuedTo,
      taxId,
      personName,
      isOverExtracted,
      hasForestGuide,
      movedRatioMin,
      movedRatioMax,
      speciesProductId,
      scientificName,
      commonName,
    } = query;

    if (search?.trim()) {
      qb.andWhere(
        '(autef.number ILIKE :search OR autef.processNumber ILIKE :search OR autef.city ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }
    if (city?.trim()) {
      qb.andWhere('autef.city ILIKE :city', { city: `%${city.trim()}%` });
    }
    if (state?.trim()) {
      qb.andWhere('autef.state ILIKE :state', { state: state.trim() });
    }
    if (issueYear != null) {
      qb.andWhere('autef.issueYear = :issueYear', { issueYear });
    }
    if (issueMonth != null) {
      qb.andWhere('autef.issueMonth = :issueMonth', { issueMonth });
    }
    if (processNumber?.trim()) {
      qb.andWhere('autef.processNumber ILIKE :processNumber', {
        processNumber: `%${processNumber.trim()}%`,
      });
    }
    if (issuedFrom) {
      qb.andWhere('autef.issuedAt >= :issuedFrom', { issuedFrom });
    }
    if (issuedTo) {
      qb.andWhere('autef.issuedAt <= :issuedTo', { issuedTo });
    }

    if (taxId?.trim()) {
      const taxIdDigits = taxId.replace(/\D/g, '');
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_person_roles pr
          INNER JOIN public_app.semaspa_people p ON p.id = pr.person_id
          WHERE pr.entity_type = 'AUTEF'
            AND pr.entity_id = autef.id
            AND regexp_replace(COALESCE(p.tax_id, ''), '\\D', '', 'g') = :taxIdDigits
        )`,
        { taxIdDigits },
      );
    }

    if (personName?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_person_roles pr
          INNER JOIN public_app.semaspa_people p ON p.id = pr.person_id
          WHERE pr.entity_type = 'AUTEF'
            AND pr.entity_id = autef.id
            AND EXISTS (
              SELECT 1 FROM unnest(COALESCE(p.names, ARRAY[]::text[])) AS n(name)
              WHERE n.name ILIKE :personName
            )
        )`,
        { personName: `%${personName.trim()}%` },
      );
    }

    if (isOverExtracted === true) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_volume_balances vb
          WHERE vb.autef_id = autef.id AND vb.is_over_extracted = true
        )`,
      );
    } else if (isOverExtracted === false) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_volume_balances vb
          WHERE vb.autef_id = autef.id AND vb.is_over_extracted = true
        )`,
      );
    }

    if (hasForestGuide === true) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_forest_guides afg
          WHERE afg.autef_id = autef.id
        )`,
      );
    } else if (hasForestGuide === false) {
      qb.andWhere(
        `NOT EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_forest_guides afg
          WHERE afg.autef_id = autef.id
        )`,
      );
    }

    if (movedRatioMin != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_volume_balances vb
          WHERE vb.autef_id = autef.id AND vb.moved_ratio >= :movedRatioMin
        )`,
        { movedRatioMin },
      );
    }
    if (movedRatioMax != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_volume_balances vb
          WHERE vb.autef_id = autef.id AND vb.moved_ratio <= :movedRatioMax
        )`,
        { movedRatioMax },
      );
    }

    if (speciesProductId?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_species aes
          WHERE aes.autef_id = autef.id AND aes.species_product_id = :speciesProductId
        )`,
        { speciesProductId: speciesProductId.trim() },
      );
    }
    if (scientificName?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_autef_species aes
          INNER JOIN public_app.semaspa_species_products sp ON sp.id = aes.species_product_id
          WHERE aes.autef_id = autef.id AND sp.scientific_name ILIKE :scientificName
        )`,
        { scientificName: `%${scientificName.trim()}%` },
      );
    }
    if (commonName?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_autef_species aes
          INNER JOIN public_app.semaspa_species_products sp ON sp.id = aes.species_product_id
          WHERE aes.autef_id = autef.id AND sp.common_name ILIKE :commonName
        )`,
        { commonName: `%${commonName.trim()}%` },
      );
    }
  }

  async findAll(query: GetAutefsQueryDto): Promise<GetAutefsResponseDto> {
    const {
      page = 1,
      limit = 20,
      withGeom = false,
      withBbox = false,
      sortBy = 'id',
      sortOrder = 'ASC',
    } = query;
    const skip = (page - 1) * limit;
    const safeSortBy = (AUTEF_SORT_FIELDS as readonly string[]).includes(sortBy) ? sortBy : 'id';
    const safeSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.autefRepo.createQueryBuilder('autef').select([
      'autef.id',
      'autef.title',
      'autef.number',
      'autef.issuedAt',
      'autef.city',
      'autef.state',
      'autef.latitude',
      'autef.longitude',
      'autef.totalAreaHa',
      'autef.processNumber',
      'autef.issueYear',
      'autef.issueMonth',
    ]);

    if (withGeom) {
      qb.addSelect('autef.geometry');
    }

    if (withBbox) {
      qb
        .addSelect('ST_XMin(ST_Envelope(autef.geom))', 'bbox_w')
        .addSelect('ST_YMin(ST_Envelope(autef.geom))', 'bbox_s')
        .addSelect('ST_XMax(ST_Envelope(autef.geom))', 'bbox_e')
        .addSelect('ST_YMax(ST_Envelope(autef.geom))', 'bbox_n');
    }

    this.applyAutefListFilters(qb, query);
    qb.orderBy(`autef.${safeSortBy}`, safeSortOrder).skip(skip).take(limit);

    const countQb = this.autefRepo.createQueryBuilder('autef');
    this.applyAutefListFilters(countQb, query);

    const [result, total] = await Promise.all([
      withBbox
        ? qb.getRawAndEntities()
        : qb.getMany().then((entities) => ({ entities, raw: [] as Record<string, unknown>[] })),
      countQb.getCount(),
    ]);

    const data = result.entities.map(
      (entity, i) =>
        new AutefResponseDto(entity, {
          withGeom,
          bbox: withBbox ? AutefsService.toBbox(result.raw[i]) : undefined,
        }),
    );

    return new GetAutefsResponseDto(data, page, limit, total);
  }

  async findOne(
    id: number,
    options: { withGeom?: boolean; withBbox?: boolean } = {},
  ): Promise<AutefResponseDto> {
    const { withGeom = false, withBbox = false } = options;

    if (!withBbox) {
      const qb = this.autefRepo.createQueryBuilder('autef').where('autef.id = :id', { id });
      if (!withGeom) {
        qb.select([
          'autef.id',
          'autef.title',
          'autef.number',
          'autef.issuedAt',
          'autef.city',
          'autef.state',
          'autef.latitude',
          'autef.longitude',
          'autef.totalAreaHa',
          'autef.processNumber',
          'autef.issueYear',
          'autef.issueMonth',
        ]);
      }
      const entity = await qb.getOne();
      if (!entity) {
        throw new NotFoundException(`AUTEF ${id} not found`);
      }
      return new AutefResponseDto(entity, { withGeom });
    }

    const qb = this.autefRepo
      .createQueryBuilder('autef')
      .select([
        'autef.id',
        'autef.title',
        'autef.number',
        'autef.issuedAt',
        'autef.city',
        'autef.state',
        'autef.latitude',
        'autef.longitude',
        'autef.totalAreaHa',
        'autef.processNumber',
        'autef.issueYear',
        'autef.issueMonth',
      ])
      .addSelect('ST_XMin(ST_Envelope(autef.geom))', 'bbox_w')
      .addSelect('ST_YMin(ST_Envelope(autef.geom))', 'bbox_s')
      .addSelect('ST_XMax(ST_Envelope(autef.geom))', 'bbox_e')
      .addSelect('ST_YMax(ST_Envelope(autef.geom))', 'bbox_n')
      .where('autef.id = :id', { id });

    if (withGeom) {
      qb.addSelect('autef.geometry');
    }

    const { entities, raw } = await qb.getRawAndEntities();
    if (!entities[0]) {
      throw new NotFoundException(`AUTEF ${id} not found`);
    }
    return new AutefResponseDto(entities[0], {
      withGeom,
      bbox: AutefsService.toBbox(raw[0]),
    });
  }

  async findSpecies(
    autefId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetAutefSpeciesResponseDto> {
    await this.assertAutefExists(autefId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.autefSpeciesRepo.findAndCount({
      where: { autefId },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return new GetAutefSpeciesResponseDto(
      rows.map((r) => new AutefSpeciesResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findVolumeBalances(
    autefId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetAutefVolumeBalancesResponseDto> {
    await this.assertAutefExists(autefId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.volumeBalanceRepo.findAndCount({
      where: { autefId },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return new GetAutefVolumeBalancesResponseDto(
      rows.map((r) => new AutefVolumeBalanceResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findForestGuides(
    autefId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetForestGuidesResponseDto> {
    await this.assertAutefExists(autefId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.forestGuideRepo
      .createQueryBuilder('gf')
      .innerJoin(SemaspaAutefForestGuide, 'bridge', 'bridge.forest_guide_id = gf.id')
      .where('bridge.autef_id = :autefId', { autefId })
      .orderBy('gf.id', 'ASC')
      .skip(skip)
      .take(limit);

    const countQb = this.autefForestGuideRepo
      .createQueryBuilder('bridge')
      .where('bridge.autefId = :autefId', { autefId });

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetForestGuidesResponseDto(
      rows.map((r) => new ForestGuideResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findHarvestUnits(
    autefId: number,
    query: SemaspaPaginationQueryDto & { withGeom?: boolean },
  ): Promise<GetHarvestUnitsResponseDto> {
    await this.assertAutefExists(autefId);
    const { page = 1, limit = 20, withGeom = false } = query;
    const skip = (page - 1) * limit;

    const qb = this.harvestUnitRepo
      .createQueryBuilder('hu')
      .innerJoin(SemaspaAutefHarvestUnit, 'bridge', 'bridge.harvest_unit_id = hu.id')
      .where('bridge.autef_id = :autefId', { autefId })
      .select([
        'hu.id',
        'hu.holder',
        'hu.propertyName',
        'hu.processNumber',
        'hu.autefNumber',
        'hu.autefYear',
        'hu.autefValidity',
        'hu.city',
        'hu.propertyAreaHa',
        'hu.unitAreaHa',
        'hu.netAreaHa',
        'hu.volumeM3',
      ])
      .orderBy('hu.id', 'ASC')
      .skip(skip)
      .take(limit);

    if (withGeom) {
      qb.addSelect('hu.geometry');
    }

    const countQb = this.autefHarvestUnitRepo
      .createQueryBuilder('bridge')
      .where('bridge.autefId = :autefId', { autefId });

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetHarvestUnitsResponseDto(
      rows.map((r) => new HarvestUnitResponseDto(r, { withGeom })),
      page,
      limit,
      total,
    );
  }

  async findRoles(
    autefId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    await this.assertAutefExists(autefId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.personRoleRepo.findAndCount({
      where: { entityType: 'AUTEF', entityId: autefId },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return new GetPersonRolesResponseDto(
      rows.map((r) => new PersonRoleResponseDto(r)),
      page,
      limit,
      total,
    );
  }
}
