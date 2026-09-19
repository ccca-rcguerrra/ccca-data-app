import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import { SemaspaPerson } from '../../../model/entities/semaspa-person.view.entity';
import { SemaspaPersonRole } from '../../../model/entities/semaspa-person-role.view.entity';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';
import { SemaspaAutefForestGuide } from '../../../model/entities/semaspa-autef-forest-guide.view.entity';
import { SemaspaForestGuidePermitReference } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';
import {
  ANY_INDICATOR_ID,
  DISTINCT_CASE_THRESHOLD,
  INDICATOR_CATALOG,
  INDICATOR_IDS,
  type CatalogIndicatorId,
  type IndicatorQueryId,
  catalogEntity,
  getCatalogIndicator,
  isGfIndicatorQuery,
  isIndicatorQueryId,
  isVolumeIndicatorQuery,
} from '../indicator-catalog';
import { GetIndicatorFiltersDto } from '../dto/get-indicator-filters.dto';
import {
  GetIndicatorCasesQueryDto,
  INDICATOR_CASE_SORT_FIELDS,
  type IndicatorCaseSortField,
} from '../dto/get-indicator-cases-query.dto';
import {
  IndicatorSummaryItemDto,
  IndicatorSummaryResponseDto,
} from '../dto/indicator-summary-response.dto';
import {
  GetIndicatorCasesResponseDto,
  IndicatorCaseResponseDto,
} from '../dto/indicator-case-response.dto';
import {
  mapAutefCase,
  mapGfCase,
  mapPersonCase,
  mapPlateCase,
} from '../indicator-case-map';

export const INDICATOR_CSV_ROW_LIMIT = 10_000;

const SORT_COLUMN: Record<IndicatorCaseSortField, string> = {
  issuedAt: 'autef.issuedAt',
  number: 'autef.number',
  city: 'autef.city',
  maxMovedRatio: 'stats.max_moved_ratio',
  maxExcessVolume: 'stats.max_excess_volume',
};

interface StatsJoinParams {
  sql: string;
  params: Record<string, unknown>;
}

@Injectable()
export class IndicatorsService {
  constructor(
    @InjectRepository(SemaspaAutef)
    private readonly autefRepo: Repository<SemaspaAutef>,
    @InjectRepository(SemaspaPerson)
    private readonly personRepo: Repository<SemaspaPerson>,
    @InjectRepository(SemaspaForestGuide)
    private readonly forestGuideRepo: Repository<SemaspaForestGuide>,
  ) {}

  async getSummary(
    filters: GetIndicatorFiltersDto,
  ): Promise<IndicatorSummaryResponseDto> {
    const generatedAt = new Date().toISOString();
    const counts = await Promise.all(
      INDICATOR_CATALOG.map((indicator) =>
        this.countCases(indicator.id, filters),
      ),
    );

    const indicators: IndicatorSummaryItemDto[] = INDICATOR_CATALOG.map(
      (indicator, index) => ({
        id: indicator.id,
        name: indicator.name,
        entity: indicator.entity,
        severity: indicator.severity,
        count: counts[index] ?? 0,
        rule: indicator.calculation,
        ruleVersion: indicator.ruleVersion,
        inputs: [...indicator.inputs],
        limitations: [...indicator.limitations],
      }),
    );

    return {
      generatedAt,
      filters: this.echoFilters(filters),
      indicators,
    };
  }

  async findCases(
    indicatorId: string,
    query: GetIndicatorCasesQueryDto,
  ): Promise<GetIndicatorCasesResponseDto> {
    const id = this.requireQueryId(indicatorId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    if (!isVolumeIndicatorQuery(id)) {
      return this.findGroupedCases(id, query, skip, page, limit);
    }

    const listQb = this.createVolumeCasesQuery(id, query);
    this.applyVolumeSort(listQb, query);
    listQb.offset(skip).limit(limit);

    const countQb = this.createVolumeCasesQuery(id, query).select(
      'COUNT(autef.id)',
      'count',
    );

    const [rows, countRow] = await Promise.all([
      listQb.getRawMany<Record<string, unknown>>(),
      countQb.getRawOne<{ count: string | number }>(),
    ]);

    const total = Number(countRow?.count ?? 0);
    return new GetIndicatorCasesResponseDto(
      rows.map((row) => mapAutefCase(row)),
      page,
      limit,
      total,
    );
  }

  async exportCasesCsv(
    indicatorId: string,
    query: GetIndicatorFiltersDto,
  ): Promise<{ filename: string; body: string }> {
    const id = this.requireQueryId(indicatorId);
    const generatedAt = new Date().toISOString();
    const catalog =
      id === ANY_INDICATOR_ID ? undefined : getCatalogIndicator(id);
    const entity = catalogEntity(id);

    const cases = isVolumeIndicatorQuery(id)
      ? await this.loadVolumeExportRows(id, query)
      : await this.loadGroupedExportRows(id, query);

    const headerLines = [
      `# indicator_id=${id}`,
      `# entity=${entity}`,
      `# rule_version=${catalog?.ruleVersion ?? ''}`,
      `# generated_at=${generatedAt}`,
    ];

    const { csvHeader, csvRows } = this.buildCsvBody(entity, cases);
    headerLines.push(`# columns=${csvHeader}`);

    const filename = `indicator-cases-${id}.csv`;
    return {
      filename,
      body: [...headerLines, csvHeader, ...csvRows].join('\n') + '\n',
    };
  }

  private requireQueryId(id: string): IndicatorQueryId {
    if (!isIndicatorQueryId(id)) {
      throw new NotFoundException(`Indicator ${id} not found`);
    }
    return id;
  }

  private countCases(
    indicatorId: CatalogIndicatorId,
    filters: GetIndicatorFiltersDto,
  ): Promise<number> {
    if (!isVolumeIndicatorQuery(indicatorId)) {
      return this.countGroupedCases(indicatorId, filters);
    }
    return this.createVolumeCasesQuery(indicatorId, filters)
      .select('COUNT(autef.id)', 'count')
      .getRawOne<{ count: string | number }>()
      .then((row) => Number(row?.count ?? 0));
  }

  private async findGroupedCases(
    indicatorId: IndicatorQueryId,
    query: GetIndicatorCasesQueryDto,
    skip: number,
    page: number,
    limit: number,
  ): Promise<GetIndicatorCasesResponseDto> {
    const listQb = this.createGroupedCasesQuery(indicatorId, query);
    this.applyGroupedSort(listQb, indicatorId);
    listQb.offset(skip).limit(limit);

    const [rows, total] = await Promise.all([
      listQb.getRawMany<Record<string, unknown>>(),
      this.countGroupedCases(indicatorId, query),
    ]);

    const mapper =
      catalogEntity(indicatorId) === 'plate'
        ? mapPlateCase
        : catalogEntity(indicatorId) === 'gf'
          ? mapGfCase
          : mapPersonCase;
    return new GetIndicatorCasesResponseDto(
      rows.map((row) => mapper(row)),
      page,
      limit,
      total,
    );
  }

  private async countGroupedCases(
    indicatorId: IndicatorQueryId,
    filters: GetIndicatorFiltersDto,
  ): Promise<number> {
    const inner = this.createGroupedCasesQuery(indicatorId, filters);
    const sql = inner.getQuery();
    const row = await this.personRepo.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(`(${sql})`, 'cases')
      .setParameters(inner.getParameters())
      .getRawOne<{ count: string | number }>();
    return Number(row?.count ?? 0);
  }

  private async loadVolumeExportRows(
    id: IndicatorQueryId,
    query: GetIndicatorFiltersDto,
  ): Promise<IndicatorCaseResponseDto[]> {
    const qb = this.createVolumeCasesQuery(id, query);
    this.applyVolumeSort(qb, { sortBy: 'issuedAt', sortOrder: 'DESC' });
    qb.limit(INDICATOR_CSV_ROW_LIMIT);
    const rows = await qb.getRawMany<Record<string, unknown>>();
    return rows.map((row) => mapAutefCase(row));
  }

  private async loadGroupedExportRows(
    id: IndicatorQueryId,
    query: GetIndicatorFiltersDto,
  ): Promise<IndicatorCaseResponseDto[]> {
    const qb = this.createGroupedCasesQuery(id, query);
    this.applyGroupedSort(qb, id);
    qb.limit(INDICATOR_CSV_ROW_LIMIT);
    const rows = await qb.getRawMany<Record<string, unknown>>();
    const mapper =
      catalogEntity(id) === 'plate'
        ? mapPlateCase
        : catalogEntity(id) === 'gf'
          ? mapGfCase
          : mapPersonCase;
    return rows.map((row) => mapper(row));
  }

  private createGroupedCasesQuery(
    indicatorId: IndicatorQueryId,
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaPerson> {
    if (isGfIndicatorQuery(indicatorId)) {
      return this.createGfPermitCasesQuery(
        indicatorId,
        filters,
      ) as unknown as SelectQueryBuilder<SemaspaPerson>;
    }
    if (indicatorId === INDICATOR_IDS.PLATE_RECURRENT) {
      return this.createPlateCasesQuery(filters) as unknown as SelectQueryBuilder<SemaspaPerson>;
    }
    if (indicatorId === INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION) {
      return this.createPersonDestinationQuery(filters);
    }
    return this.createPersonOverExtractedQuery(filters);
  }

  private createPersonOverExtractedQuery(
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaPerson> {
    const flagged = this.flaggedOverExtractedSql(filters);
    return this.personRepo
      .createQueryBuilder('person')
      .innerJoin(SemaspaPersonRole, 'pr', 'pr.person_id = person.id')
      .innerJoin(`(${flagged.sql})`, 'flagged', 'flagged.autef_id = pr.entity_id')
      .where("pr.entity_type = 'AUTEF'")
      .andWhere('pr.role IN (:...ownerRoles)', {
        ownerRoles: ['PROPRIETARIO', 'RESPONSAVEL_TECNICO'],
      })
      .select('person.id', 'personId')
      .addSelect('person.names', 'names')
      .addSelect('person.taxId', 'taxId')
      .addSelect('person.city', 'city')
      .addSelect('person.state', 'state')
      .addSelect('person.roleTypes', 'roleTypes')
      .addSelect('COUNT(DISTINCT pr.entity_id)', 'distinctAutefCount')
      .addSelect('CAST(0 AS int)', 'distinctGfCount')
      .groupBy('person.id')
      .addGroupBy('person.names')
      .addGroupBy('person.taxId')
      .addGroupBy('person.city')
      .addGroupBy('person.state')
      .addGroupBy('person.roleTypes')
      .having('COUNT(DISTINCT pr.entity_id) >= :threshold', {
        threshold: DISTINCT_CASE_THRESHOLD,
      })
      .setParameters(flagged.params);
  }

  private createPersonDestinationQuery(
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaPerson> {
    const flagged = this.flaggedOverExtractedSql(filters);
    return this.personRepo
      .createQueryBuilder('person')
      .innerJoin(SemaspaPersonRole, 'pr', 'pr.person_id = person.id')
      .innerJoin(
        SemaspaAutefForestGuide,
        'bridge',
        'bridge.forest_guide_id = pr.entity_id',
      )
      .innerJoin(
        `(${flagged.sql})`,
        'flagged',
        'flagged.autef_id = bridge.autef_id',
      )
      .where("pr.entity_type = 'GF'")
      .andWhere("pr.role = 'DESTINO_GF'")
      .select('person.id', 'personId')
      .addSelect('person.names', 'names')
      .addSelect('person.taxId', 'taxId')
      .addSelect('person.city', 'city')
      .addSelect('person.state', 'state')
      .addSelect('person.roleTypes', 'roleTypes')
      .addSelect('CAST(0 AS int)', 'distinctAutefCount')
      .addSelect('COUNT(DISTINCT pr.entity_id)', 'distinctGfCount')
      .groupBy('person.id')
      .addGroupBy('person.names')
      .addGroupBy('person.taxId')
      .addGroupBy('person.city')
      .addGroupBy('person.state')
      .addGroupBy('person.roleTypes')
      .having('COUNT(DISTINCT pr.entity_id) >= :threshold', {
        threshold: DISTINCT_CASE_THRESHOLD,
      })
      .setParameters(flagged.params);
  }

  private createPlateCasesQuery(
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaForestGuide> {
    const flagged = this.flaggedOverExtractedSql(filters);
    return this.forestGuideRepo
      .createQueryBuilder('gf')
      .select('plate_row.plate', 'plate')
      .addSelect('COUNT(DISTINCT gf.id)', 'distinctGfCount')
      .addSelect('COUNT(DISTINCT flagged.autef_id)', 'distinctAutefCount')
      .innerJoin(
        SemaspaAutefForestGuide,
        'bridge',
        'bridge.forest_guide_id = gf.id',
      )
      .innerJoin(
        `(${flagged.sql})`,
        'flagged',
        'flagged.autef_id = bridge.autef_id',
      )
      .innerJoin(
        `(SELECT gf_src.id AS forest_guide_id, TRIM(plate_value) AS plate
          FROM public_app.semaspa_forest_guides gf_src
          CROSS JOIN LATERAL unnest(COALESCE(gf_src.vehicle_plates, ARRAY[]::text[])) AS plate_value
          WHERE TRIM(plate_value) <> '')`,
        'plate_row',
        'plate_row.forest_guide_id = gf.id',
      )
      .groupBy('plate_row.plate')
      .having('COUNT(DISTINCT flagged.autef_id) >= :threshold', {
        threshold: DISTINCT_CASE_THRESHOLD,
      })
      .setParameters(flagged.params);
  }

  private createGfPermitCasesQuery(
    indicatorId: IndicatorQueryId,
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaForestGuide> {
    const matchStatus =
      indicatorId === INDICATOR_IDS.GF_PERMIT_UNPARSEABLE
        ? 'unparseable'
        : 'unmatched';
    const qb = this.forestGuideRepo
      .createQueryBuilder('gf')
      .innerJoin(
        SemaspaForestGuidePermitReference,
        'ref',
        'ref.forest_guide_id = gf.id',
      )
      .where(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_forest_guide_permit_references flagged
          WHERE flagged.forest_guide_id = gf.id
            AND flagged.match_status = :matchStatus
        )`,
        { matchStatus },
      )
      .select('gf.id', 'forestGuideId')
      .addSelect('gf.number', 'number')
      .addSelect('gf.issuedAt', 'issuedAt')
      .addSelect('gf.type', 'type')
      .addSelect(
        'array_agg(DISTINCT ref.match_status ORDER BY ref.match_status)',
        'matchStatuses',
      )
      .addSelect(
        'array_agg(DISTINCT ref.raw_reference ORDER BY ref.raw_reference)',
        'rawReferences',
      )
      .groupBy('gf.id')
      .addGroupBy('gf.number')
      .addGroupBy('gf.issuedAt')
      .addGroupBy('gf.type');
    if (filters.issuedFrom) {
      qb.andWhere('gf.issuedAt >= :issuedFrom', {
        issuedFrom: filters.issuedFrom,
      });
    }
    if (filters.issuedTo) {
      qb.andWhere('gf.issuedAt <= :issuedTo', { issuedTo: filters.issuedTo });
    }
    return qb;
  }

  private applyGroupedSort(
    qb: SelectQueryBuilder<ObjectLiteral>,
    indicatorId: IndicatorQueryId,
  ): void {
    if (isGfIndicatorQuery(indicatorId)) {
      qb.orderBy('gf.issuedAt', 'DESC', 'NULLS LAST');
      qb.addOrderBy('gf.id', 'DESC');
      return;
    }
    if (indicatorId === INDICATOR_IDS.PLATE_RECURRENT) {
      qb.orderBy('COUNT(DISTINCT flagged.autef_id)', 'DESC');
      qb.addOrderBy('plate_row.plate', 'ASC');
      return;
    }
    if (indicatorId === INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION) {
      qb.orderBy('COUNT(DISTINCT pr.entity_id)', 'DESC');
      qb.addOrderBy('person.id', 'ASC');
      return;
    }
    qb.orderBy('COUNT(DISTINCT pr.entity_id)', 'DESC');
    qb.addOrderBy('person.id', 'ASC');
  }

  private createVolumeCasesQuery(
    indicatorId: IndicatorQueryId,
    filters: GetIndicatorFiltersDto,
  ): SelectQueryBuilder<SemaspaAutef> {
    const stats = this.buildStatsJoin(filters);
    const qb = this.autefRepo
      .createQueryBuilder('autef')
      .select('autef.id', 'autefId')
      .addSelect('autef.number', 'number')
      .addSelect('autef.city', 'city')
      .addSelect('autef.state', 'state')
      .addSelect('autef.issuedAt', 'issuedAt')
      .addSelect('stats.max_moved_ratio', 'maxMovedRatio')
      .addSelect('stats.max_excess_volume', 'maxExcessVolume')
      .addSelect('stats.has_unit_conflict', 'hasUnitConflict')
      .addSelect('stats.has_over_extracted', 'hasOverExtracted')
      .addSelect('stats.has_credit_use_over_90', 'hasCreditUseOver90')
      .innerJoin(`(${stats.sql})`, 'stats', 'stats.autef_id = autef.id')
      .setParameters(stats.params);

    this.applyAutefFilters(qb, filters);
    this.applyIndicatorFlag(qb, indicatorId);
    return qb;
  }

  private flaggedOverExtractedSql(
    filters: GetIndicatorFiltersDto,
  ): StatsJoinParams {
    const stats = this.buildStatsJoin(filters);
    const params: Record<string, unknown> = { ...stats.params };
    const conditions: string[] = ['stats.has_over_extracted = true'];

    if (filters.city?.trim()) {
      conditions.push('autef.city ILIKE :flaggedCity');
      params.flaggedCity = `%${filters.city.trim()}%`;
    }
    if (filters.state?.trim()) {
      conditions.push('autef.state ILIKE :flaggedState');
      params.flaggedState = `%${filters.state.trim()}%`;
    }
    if (filters.issuedFrom) {
      conditions.push('autef.issued_at >= :flaggedIssuedFrom');
      params.flaggedIssuedFrom = filters.issuedFrom;
    }
    if (filters.issuedTo) {
      conditions.push('autef.issued_at <= :flaggedIssuedTo');
      params.flaggedIssuedTo = filters.issuedTo;
    }

    const sql = `
      SELECT autef.id AS autef_id
      FROM public_app.semaspa_autefs autef
      INNER JOIN (${stats.sql}) stats ON stats.autef_id = autef.id
      WHERE ${conditions.join(' AND ')}
    `;
    return { sql, params };
  }

  private buildStatsJoin(filters: GetIndicatorFiltersDto): StatsJoinParams {
    const params: Record<string, unknown> = {};
    const conditions: string[] = ['1=1'];

    if (filters.speciesProductId?.trim()) {
      conditions.push('vb.species_product_id = :speciesProductId');
      params.speciesProductId = filters.speciesProductId.trim();
    }
    if (filters.scientificName?.trim()) {
      conditions.push('sp.scientific_name ILIKE :scientificName');
      params.scientificName = `%${filters.scientificName.trim()}%`;
    }
    if (filters.commonName?.trim()) {
      conditions.push('sp.common_name ILIKE :commonName');
      params.commonName = `%${filters.commonName.trim()}%`;
    }
    if (filters.movedRatioMin != null) {
      conditions.push('vb.moved_ratio >= :movedRatioMin');
      params.movedRatioMin = filters.movedRatioMin;
    }
    if (filters.movedRatioMax != null) {
      conditions.push('vb.moved_ratio <= :movedRatioMax');
      params.movedRatioMax = filters.movedRatioMax;
    }
    if (filters.excessVolumeMin != null) {
      conditions.push('vb.excess_volume >= :excessVolumeMin');
      params.excessVolumeMin = filters.excessVolumeMin;
    }

    const sql = `
      SELECT
        vb.autef_id AS autef_id,
        MAX(vb.moved_ratio) AS max_moved_ratio,
        MAX(vb.excess_volume) AS max_excess_volume,
        COALESCE(BOOL_OR(vb.has_unit_conflict), false) AS has_unit_conflict,
        COALESCE(BOOL_OR(vb.is_over_extracted), false) AS has_over_extracted,
        COALESCE(BOOL_OR(vb.moved_ratio >= 0.9), false) AS has_credit_use_over_90
      FROM public_app.semaspa_autef_volume_balances vb
      LEFT JOIN public_app.semaspa_species_products sp ON sp.id = vb.species_product_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY vb.autef_id
    `;

    return { sql, params };
  }

  private applyAutefFilters(
    qb: SelectQueryBuilder<SemaspaAutef>,
    filters: GetIndicatorFiltersDto,
  ): void {
    if (filters.city?.trim()) {
      qb.andWhere('autef.city ILIKE :city', {
        city: `%${filters.city.trim()}%`,
      });
    }
    if (filters.state?.trim()) {
      qb.andWhere('autef.state ILIKE :state', { state: filters.state.trim() });
    }
    if (filters.issuedFrom) {
      qb.andWhere('autef.issuedAt >= :issuedFrom', {
        issuedFrom: filters.issuedFrom,
      });
    }
    if (filters.issuedTo) {
      qb.andWhere('autef.issuedAt <= :issuedTo', {
        issuedTo: filters.issuedTo,
      });
    }
  }

  private applyIndicatorFlag(
    qb: SelectQueryBuilder<SemaspaAutef>,
    indicatorId: IndicatorQueryId,
  ): void {
    if (indicatorId === ANY_INDICATOR_ID) {
      qb.andWhere(
        '(stats.has_over_extracted = true OR stats.has_credit_use_over_90 = true OR stats.has_unit_conflict = true)',
      );
      return;
    }

    if (indicatorId === INDICATOR_IDS.OVER_EXTRACTED) {
      qb.andWhere('stats.has_over_extracted = true');
      return;
    }
    if (indicatorId === INDICATOR_IDS.CREDIT_USE_OVER_90) {
      qb.andWhere('stats.has_credit_use_over_90 = true');
      return;
    }
    qb.andWhere('stats.has_unit_conflict = true');
  }

  private applyVolumeSort(
    qb: SelectQueryBuilder<SemaspaAutef>,
    query: Pick<GetIndicatorCasesQueryDto, 'sortBy' | 'sortOrder'>,
  ): void {
    const sortBy = (INDICATOR_CASE_SORT_FIELDS as readonly string[]).includes(
      query.sortBy ?? '',
    )
      ? (query.sortBy as IndicatorCaseSortField)
      : 'issuedAt';
    const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    qb.orderBy(SORT_COLUMN[sortBy], sortOrder, 'NULLS LAST');
    qb.addOrderBy('autef.id', 'DESC');
  }

  private echoFilters(filters: GetIndicatorFiltersDto): GetIndicatorFiltersDto {
    const echoed: GetIndicatorFiltersDto = {};
    if (filters.city?.trim()) echoed.city = filters.city.trim();
    if (filters.state?.trim()) echoed.state = filters.state.trim();
    if (filters.issuedFrom) echoed.issuedFrom = filters.issuedFrom;
    if (filters.issuedTo) echoed.issuedTo = filters.issuedTo;
    if (filters.speciesProductId?.trim()) {
      echoed.speciesProductId = filters.speciesProductId.trim();
    }
    if (filters.scientificName?.trim()) {
      echoed.scientificName = filters.scientificName.trim();
    }
    if (filters.commonName?.trim())
      echoed.commonName = filters.commonName.trim();
    if (filters.movedRatioMin != null)
      echoed.movedRatioMin = filters.movedRatioMin;
    if (filters.movedRatioMax != null)
      echoed.movedRatioMax = filters.movedRatioMax;
    if (filters.excessVolumeMin != null) {
      echoed.excessVolumeMin = filters.excessVolumeMin;
    }
    return echoed;
  }

  private buildCsvBody(
    entity: 'autef' | 'person' | 'plate' | 'gf',
    cases: IndicatorCaseResponseDto[],
  ): { csvHeader: string; csvRows: string[] } {
    if (entity === 'person') {
      const csvHeader =
        'person_id,names,tax_id,city,state,role_types,distinct_autef_count,distinct_gf_count';
      const csvRows = cases.map((item) =>
        [
          item.personId,
          (item.names ?? []).join('|'),
          item.taxId,
          item.city,
          item.state,
          (item.roleTypes ?? []).join('|'),
          item.distinctAutefCount,
          item.distinctGfCount,
        ]
          .map((value) => this.escapeCsv(value))
          .join(','),
      );
      return { csvHeader, csvRows };
    }

    if (entity === 'plate') {
      const csvHeader = 'plate,distinct_gf_count,distinct_autef_count';
      const csvRows = cases.map((item) =>
        [item.plate, item.distinctGfCount, item.distinctAutefCount]
          .map((value) => this.escapeCsv(value))
          .join(','),
      );
      return { csvHeader, csvRows };
    }

    if (entity === 'gf') {
      const csvHeader =
        'forest_guide_id,number,issued_at,type,match_statuses,raw_references';
      const csvRows = cases.map((item) =>
        this.joinCsvRow([
          item.forestGuideId,
          item.number,
          this.formatCsvDate(item.issuedAt ?? null),
          item.type,
          (item.matchStatuses ?? []).join('|'),
          (item.rawReferences ?? []).join('|'),
        ]),
      );
      return { csvHeader, csvRows };
    }

    const csvHeader =
      'autef_id,number,city,state,issued_at,matched_indicator_ids,max_moved_ratio,max_excess_volume,has_unit_conflict';
    const csvRows = cases.map((item) =>
      [
        item.autefId,
        item.number,
        item.city,
        item.state,
        this.formatCsvDate(item.issuedAt ?? null),
        (item.matchedIndicatorIds ?? []).join('|'),
        item.maxMovedRatio,
        item.maxExcessVolume,
        item.hasUnitConflict,
      ]
        .map((value) => this.escapeCsv(value))
        .join(','),
    );
    return { csvHeader, csvRows };
  }

  private formatCsvDate(value: Date | string | null): string {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  private joinCsvRow(
    values: Array<string | number | boolean | null | undefined>,
  ): string {
    return values.map((value) => this.escapeCsv(value)).join(',');
  }

  private escapeCsv(
    value: string | number | boolean | null | undefined,
  ): string {
    if (value == null || value === '') return '';
    const text = typeof value === 'string' ? value : String(value);
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }
}
