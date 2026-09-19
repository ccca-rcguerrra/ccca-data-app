import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaPerson } from '../../../model/entities/semaspa-person.view.entity';
import { SemaspaPersonRole } from '../../../model/entities/semaspa-person-role.view.entity';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';
import { GetPeopleQueryDto } from '../dto/get-people-query.dto';
import { PersonResponseDto } from '../dto/person-response.dto';
import { PersonParticipationResponseDto } from '../dto/person-participation-response.dto';
import { AutefResponseDto } from '../../autefs/dto/autef-response.dto';
import { ForestGuideResponseDto } from '../../forest-guides/dto/forest-guide-response.dto';
import {
  GetPeopleResponseDto,
  GetPersonLinkedAutefsResponseDto,
  GetPersonLinkedForestGuidesResponseDto,
  GetPersonRolesResponseDto,
} from '../../shared/paginated-responses.dto';
import { PersonRoleResponseDto } from '../../shared/person-role-response.dto';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';
import { mapPersonParticipation, parseCount } from '../person-participation';
import { SemaspaAutefForestGuide } from '../../../model/entities/semaspa-autef-forest-guide.view.entity';
import {
  GetPersonLinkedAutefsQueryDto,
  GetPersonLinkedForestGuidesQueryDto,
  type PersonAutefOccurrenceFlag,
  type PersonGfOccurrenceFlag,
} from '../dto/get-person-linked-query.dto';

const OWNER_RT_ROLES = ['PROPRIETARIO', 'RESPONSAVEL_TECNICO'] as const;

const FLAGGED_OVER_EXTRACTED_SQL = `
  SELECT vb.autef_id AS autef_id
  FROM public_app.semaspa_autef_volume_balances vb
  WHERE vb.is_over_extracted = true
  GROUP BY vb.autef_id
`;

const FLAGGED_UNIT_CONFLICT_SQL = `
  SELECT vb.autef_id AS autef_id
  FROM public_app.semaspa_autef_volume_balances vb
  WHERE vb.has_unit_conflict = true
  GROUP BY vb.autef_id
`;

const FLAGGED_CREDIT_USE_SQL = `
  SELECT vb.autef_id AS autef_id
  FROM public_app.semaspa_autef_volume_balances vb
  WHERE vb.moved_ratio >= 0.9
  GROUP BY vb.autef_id
`;

const PLATE_UNNEST_SQL = `
  SELECT gf_src.id AS forest_guide_id, TRIM(plate_value) AS plate
  FROM public_app.semaspa_forest_guides gf_src
  CROSS JOIN LATERAL unnest(COALESCE(gf_src.vehicle_plates, ARRAY[]::text[])) AS plate_value
  WHERE TRIM(plate_value) <> ''
`;

const GF_IDS_WITH_PLATES_SQL = `
  SELECT DISTINCT gf_src.id AS forest_guide_id
  FROM public_app.semaspa_forest_guides gf_src
  CROSS JOIN LATERAL unnest(COALESCE(gf_src.vehicle_plates, ARRAY[]::text[])) AS plate_value
  WHERE TRIM(plate_value) <> ''
`;

function flaggedAutefSql(flag: PersonAutefOccurrenceFlag): string {
  if (flag === 'unit_conflict') return FLAGGED_UNIT_CONFLICT_SQL;
  if (flag === 'credit_use_over_90') return FLAGGED_CREDIT_USE_SQL;
  return FLAGGED_OVER_EXTRACTED_SQL;
}

const AUTEF_LIST_COLUMNS = [
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
] as const;

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(SemaspaPerson)
    private readonly personRepo: Repository<SemaspaPerson>,
    @InjectRepository(SemaspaPersonRole)
    private readonly personRoleRepo: Repository<SemaspaPersonRole>,
    @InjectRepository(SemaspaAutef)
    private readonly autefRepo: Repository<SemaspaAutef>,
    @InjectRepository(SemaspaForestGuide)
    private readonly forestGuideRepo: Repository<SemaspaForestGuide>,
  ) {}

  private async assertPersonExists(id: string): Promise<void> {
    const exists = await this.personRepo.exist({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Person ${id} not found`);
    }
  }

  async findAll(query: GetPeopleQueryDto): Promise<GetPeopleResponseDto> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.personRepo.createQueryBuilder('person');

    if (search) {
      qb.andWhere(
        `(person.taxId ILIKE :search
          OR person.city ILIKE :search
          OR array_to_string(person.names, ' ') ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    qb.orderBy('person.id', 'ASC').skip(skip).take(limit);

    const countQb = this.personRepo.createQueryBuilder('person');
    if (search) {
      countQb.andWhere(
        `(person.taxId ILIKE :search
          OR person.city ILIKE :search
          OR array_to_string(person.names, ' ') ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetPeopleResponseDto(
      rows.map((r) => new PersonResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string): Promise<PersonResponseDto> {
    const entity = await this.personRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Person ${id} not found`);
    }
    return new PersonResponseDto(entity);
  }

  async findRoles(
    personId: string,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    await this.assertPersonExists(personId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.personRoleRepo.findAndCount({
      where: { personId },
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

  async findParticipation(personId: string): Promise<PersonParticipationResponseDto> {
    await this.assertPersonExists(personId);

    const roleQb = this.personRoleRepo
      .createQueryBuilder('pr')
      .select('pr.role', 'role')
      .addSelect('COUNT(DISTINCT pr.entityId)', 'count')
      .where('pr.personId = :personId', { personId })
      .groupBy('pr.role');

    const typeQb = this.personRoleRepo
      .createQueryBuilder('pr')
      .select('pr.entityType', 'entity_type')
      .addSelect('COUNT(DISTINCT pr.entityId)', 'count')
      .where('pr.personId = :personId', { personId })
      .groupBy('pr.entityType');

    const [roleRows, typeRows, occurrences] = await Promise.all([
      roleQb.getRawMany<{ role: string; count: string | number }>(),
      typeQb.getRawMany<{ entity_type: string; count: string | number }>(),
      this.findOccurrenceCounts(personId),
    ]);

    return { ...mapPersonParticipation(roleRows, typeRows), ...occurrences };
  }

  async findAutefs(
    personId: string,
    query: GetPersonLinkedAutefsQueryDto,
  ): Promise<GetPersonLinkedAutefsResponseDto> {
    await this.assertPersonExists(personId);
    const { page = 1, limit = 20, flag } = query;
    const skip = (page - 1) * limit;

    const listQb = this.createPersonAutefRolesQuery(personId, flag);
    const countQb = this.createPersonAutefRolesQuery(personId, flag).select(
      'COUNT(DISTINCT pr.id)',
      'count',
    );
    const [roles, countRow] = await Promise.all([
      listQb
        .orderBy('pr.entityId', 'ASC')
        .addOrderBy('pr.role', 'ASC')
        .skip(skip)
        .take(limit)
        .getMany(),
      countQb.getRawOne<{ count: string | number }>(),
    ]);
    const total = parseCount(countRow?.count);

    if (roles.length === 0) {
      return new GetPersonLinkedAutefsResponseDto([], page, limit, total);
    }

    const autefIds = [...new Set(roles.map((role) => role.entityId))];
    const autefs = await this.autefRepo
      .createQueryBuilder('autef')
      .select([...AUTEF_LIST_COLUMNS])
      .where('autef.id IN (:...autefIds)', { autefIds })
      .getMany();
    const autefById = new Map(autefs.map((autef) => [autef.id, autef]));

    const data = roles.flatMap((role) => {
      const autef = autefById.get(role.entityId);
      if (!autef) return [];
      return [
        {
          role: role.role,
          source: role.source,
          autef: new AutefResponseDto(autef),
        },
      ];
    });

    return new GetPersonLinkedAutefsResponseDto(data, page, limit, total);
  }

  async findForestGuides(
    personId: string,
    query: GetPersonLinkedForestGuidesQueryDto,
  ): Promise<GetPersonLinkedForestGuidesResponseDto> {
    await this.assertPersonExists(personId);
    const { page = 1, limit = 20, flag } = query;
    const skip = (page - 1) * limit;

    const listQb = this.createPersonGfRolesQuery(personId, flag);
    const countQb = this.createPersonGfRolesQuery(personId, flag).select(
      'COUNT(DISTINCT pr.id)',
      'count',
    );
    const [roles, countRow] = await Promise.all([
      listQb
        .orderBy('pr.entityId', 'ASC')
        .addOrderBy('pr.role', 'ASC')
        .skip(skip)
        .take(limit)
        .getMany(),
      countQb.getRawOne<{ count: string | number }>(),
    ]);
    const total = parseCount(countRow?.count);

    if (roles.length === 0) {
      return new GetPersonLinkedForestGuidesResponseDto([], page, limit, total);
    }

    const forestGuideIds = [...new Set(roles.map((role) => role.entityId))];
    const forestGuides = await this.forestGuideRepo
      .createQueryBuilder('gf')
      .where('gf.id IN (:...forestGuideIds)', { forestGuideIds })
      .getMany();
    const forestGuideById = new Map(
      forestGuides.map((forestGuide) => [forestGuide.id, forestGuide]),
    );

    const data = roles.flatMap((role) => {
      const forestGuide = forestGuideById.get(role.entityId);
      if (!forestGuide) return [];
      return [
        {
          role: role.role,
          source: role.source,
          forestGuide: new ForestGuideResponseDto(forestGuide),
        },
      ];
    });

    return new GetPersonLinkedForestGuidesResponseDto(data, page, limit, total);
  }

  private async findOccurrenceCounts(personId: string): Promise<{
    overExtractedAutefCount: number;
    unitConflictAutefCount: number;
    creditUseOver90AutefCount: number;
    recurrentDestinationGfCount: number;
    associatedPlateCount: number;
    associatedPlateSample: string | null;
  }> {
    const [
      overExtractedAutefCount,
      unitConflictAutefCount,
      creditUseOver90AutefCount,
      recurrentDestinationGfCount,
      plates,
    ] = await Promise.all([
      this.countOwnerRtFlaggedAutefs(personId, FLAGGED_OVER_EXTRACTED_SQL),
      this.countOwnerRtFlaggedAutefs(personId, FLAGGED_UNIT_CONFLICT_SQL),
      this.countOwnerRtFlaggedAutefs(personId, FLAGGED_CREDIT_USE_SQL),
      this.countDestinationOverExtractedGfs(personId),
      this.countAssociatedPlates(personId),
    ]);
    return {
      overExtractedAutefCount,
      unitConflictAutefCount,
      creditUseOver90AutefCount,
      recurrentDestinationGfCount,
      associatedPlateCount: plates.count,
      associatedPlateSample: plates.sample,
    };
  }

  private async countOwnerRtFlaggedAutefs(
    personId: string,
    flaggedSql: string,
  ): Promise<number> {
    const row = await this.personRoleRepo
      .createQueryBuilder('pr')
      .innerJoin(`(${flaggedSql})`, 'flagged', 'flagged.autef_id = pr.entity_id')
      .select('COUNT(DISTINCT pr.entity_id)', 'count')
      .where('pr.person_id = :personId', { personId })
      .andWhere("pr.entity_type = 'AUTEF'")
      .andWhere('pr.role IN (:...ownerRoles)', { ownerRoles: [...OWNER_RT_ROLES] })
      .getRawOne<{ count: string | number }>();
    return parseCount(row?.count);
  }

  private async countDestinationOverExtractedGfs(personId: string): Promise<number> {
    const row = await this.personRoleRepo
      .createQueryBuilder('pr')
      .innerJoin(
        SemaspaAutefForestGuide,
        'bridge',
        'bridge.forest_guide_id = pr.entity_id',
      )
      .innerJoin(
        `(${FLAGGED_OVER_EXTRACTED_SQL})`,
        'flagged',
        'flagged.autef_id = bridge.autef_id',
      )
      .select('COUNT(DISTINCT pr.entity_id)', 'count')
      .where('pr.person_id = :personId', { personId })
      .andWhere("pr.entity_type = 'GF'")
      .andWhere("pr.role = 'DESTINO_GF'")
      .getRawOne<{ count: string | number }>();
    return parseCount(row?.count);
  }

  private async countAssociatedPlates(personId: string): Promise<{
    count: number;
    sample: string | null;
  }> {
    const row = await this.personRoleRepo
      .createQueryBuilder('pr')
      .innerJoin(
        SemaspaAutefForestGuide,
        'bridge',
        'bridge.forest_guide_id = pr.entity_id',
      )
      .innerJoin(
        `(${FLAGGED_OVER_EXTRACTED_SQL})`,
        'flagged',
        'flagged.autef_id = bridge.autef_id',
      )
      .innerJoin(
        `(${PLATE_UNNEST_SQL})`,
        'plate_row',
        'plate_row.forest_guide_id = pr.entity_id',
      )
      .select('COUNT(DISTINCT plate_row.plate)', 'count')
      .addSelect('MIN(plate_row.plate)', 'sample')
      .where('pr.person_id = :personId', { personId })
      .andWhere("pr.entity_type = 'GF'")
      .getRawOne<{ count: string | number; sample?: string | null }>();
    const count = parseCount(row?.count);
    const sample = typeof row?.sample === 'string' && row.sample.trim() !== ''
      ? row.sample.trim()
      : null;
    return { count, sample: count === 1 ? sample : null };
  }

  private createPersonAutefRolesQuery(
    personId: string,
    flag?: PersonAutefOccurrenceFlag,
  ) {
    const qb = this.personRoleRepo
      .createQueryBuilder('pr')
      .where('pr.person_id = :personId', { personId })
      .andWhere("pr.entity_type = 'AUTEF'");
    if (!flag) return qb;
    qb.innerJoin(
      `(${flaggedAutefSql(flag)})`,
      'flagged',
      'flagged.autef_id = pr.entity_id',
    ).andWhere('pr.role IN (:...ownerRoles)', { ownerRoles: [...OWNER_RT_ROLES] });
    return qb;
  }

  private createPersonGfRolesQuery(
    personId: string,
    flag?: PersonGfOccurrenceFlag,
  ) {
    const qb = this.personRoleRepo
      .createQueryBuilder('pr')
      .where('pr.person_id = :personId', { personId })
      .andWhere("pr.entity_type = 'GF'");
    if (!flag) return qb;
    qb.innerJoin(
      SemaspaAutefForestGuide,
      'bridge',
      'bridge.forest_guide_id = pr.entity_id',
    ).innerJoin(
      `(${FLAGGED_OVER_EXTRACTED_SQL})`,
      'flagged',
      'flagged.autef_id = bridge.autef_id',
    );
    if (flag === 'destination_over_extracted') {
      qb.andWhere("pr.role = 'DESTINO_GF'");
      return qb;
    }
    qb.innerJoin(
      `(${GF_IDS_WITH_PLATES_SQL})`,
      'plate_gf',
      'plate_gf.forest_guide_id = pr.entity_id',
    );
    return qb;
  }
}
