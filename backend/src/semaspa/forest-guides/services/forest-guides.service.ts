import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';
import { SemaspaForestGuideSpecies } from '../../../model/entities/semaspa-forest-guide-species.view.entity';
import { SemaspaPersonRole } from '../../../model/entities/semaspa-person-role.view.entity';
import { SemaspaAutefForestGuide } from '../../../model/entities/semaspa-autef-forest-guide.view.entity';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import {
  FOREST_GUIDE_SORT_FIELDS,
  GetForestGuidesQueryDto,
} from '../dto/get-forest-guides-query.dto';
import { ForestGuideResponseDto } from '../dto/forest-guide-response.dto';
import { AutefResponseDto } from '../../autefs/dto/autef-response.dto';
import { GetAutefsResponseDto } from '../../autefs/dto/get-autefs-response.dto';
import { GetForestGuidesResponseDto } from '../../shared/paginated-responses.dto';
import { ForestGuideSpeciesResponseDto } from '../../shared/forest-guide-species-response.dto';
import { PersonRoleResponseDto } from '../../shared/person-role-response.dto';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';
import {
  GetForestGuideSpeciesResponseDto,
  GetPersonRolesResponseDto,
} from '../../shared/paginated-responses.dto';

@Injectable()
export class ForestGuidesService {
  constructor(
    @InjectRepository(SemaspaForestGuide)
    private readonly forestGuideRepo: Repository<SemaspaForestGuide>,
    @InjectRepository(SemaspaForestGuideSpecies)
    private readonly speciesRepo: Repository<SemaspaForestGuideSpecies>,
    @InjectRepository(SemaspaPersonRole)
    private readonly personRoleRepo: Repository<SemaspaPersonRole>,
    @InjectRepository(SemaspaAutefForestGuide)
    private readonly autefForestGuideRepo: Repository<SemaspaAutefForestGuide>,
    @InjectRepository(SemaspaAutef)
    private readonly autefRepo: Repository<SemaspaAutef>,
  ) {}

  private async assertExists(id: number): Promise<void> {
    const exists = await this.forestGuideRepo.exist({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Forest guide ${id} not found`);
    }
  }

  private applyListFilters(
    qb: SelectQueryBuilder<SemaspaForestGuide>,
    query: GetForestGuidesQueryDto,
  ): void {
    const {
      search,
      status,
      type,
      issuedFrom,
      issuedTo,
      autefId,
      taxId,
      personName,
      speciesProductId,
      scientificName,
      commonName,
      plate,
      permitRef,
      volumeMin,
      volumeMax,
      valueMin,
      valueMax,
    } = query;

    if (search?.trim()) {
      qb.andWhere('gf.number ILIKE :search', { search: `%${search.trim()}%` });
    }
    if (status?.trim()) {
      qb.andWhere('gf.status = :status', { status: status.trim() });
    }
    if (type?.trim()) {
      qb.andWhere('gf.type = :type', { type: type.trim() });
    }
    if (issuedFrom) {
      qb.andWhere('gf.issuedAt >= :issuedFrom', { issuedFrom });
    }
    if (issuedTo) {
      qb.andWhere('gf.issuedAt <= :issuedTo', { issuedTo });
    }

    if (autefId != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_autef_forest_guides afg
          WHERE afg.forest_guide_id = gf.id AND afg.autef_id = :autefId
        )`,
        { autefId },
      );
    }

    if (taxId?.trim()) {
      const taxIdDigits = taxId.replace(/\D/g, '');
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_person_roles pr
          INNER JOIN public_app.semaspa_people p ON p.id = pr.person_id
          WHERE pr.entity_type = 'GF'
            AND pr.entity_id = gf.id
            AND pr.role IN ('ORIGEM_GF', 'DESTINO_GF')
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
          WHERE pr.entity_type = 'GF'
            AND pr.entity_id = gf.id
            AND pr.role IN ('ORIGEM_GF', 'DESTINO_GF')
            AND EXISTS (
              SELECT 1 FROM unnest(COALESCE(p.names, ARRAY[]::text[])) AS n(name)
              WHERE n.name ILIKE :personName
            )
        )`,
        { personName: `%${personName.trim()}%` },
      );
    }

    if (speciesProductId?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_forest_guide_species fgs
          WHERE fgs.forest_guide_id = gf.id AND fgs.species_product_id = :speciesProductId
        )`,
        { speciesProductId: speciesProductId.trim() },
      );
    }
    if (scientificName?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_forest_guide_species fgs
          INNER JOIN public_app.semaspa_species_products sp ON sp.id = fgs.species_product_id
          WHERE fgs.forest_guide_id = gf.id AND sp.scientific_name ILIKE :scientificName
        )`,
        { scientificName: `%${scientificName.trim()}%` },
      );
    }
    if (commonName?.trim()) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM public_app.semaspa_forest_guide_species fgs
          INNER JOIN public_app.semaspa_species_products sp ON sp.id = fgs.species_product_id
          WHERE fgs.forest_guide_id = gf.id AND sp.common_name ILIKE :commonName
        )`,
        { commonName: `%${commonName.trim()}%` },
      );
    }

    if (plate?.trim()) {
      qb.andWhere(':plate = ANY(gf.vehicle_plates)', { plate: plate.trim() });
    }
    if (permitRef?.trim()) {
      qb.andWhere(':permitRef = ANY(gf.permit_refs)', { permitRef: permitRef.trim() });
    }

    if (volumeMin != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_forest_guide_species fgs
          WHERE fgs.forest_guide_id = gf.id AND fgs.volume >= :volumeMin
        )`,
        { volumeMin },
      );
    }
    if (volumeMax != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_forest_guide_species fgs
          WHERE fgs.forest_guide_id = gf.id AND fgs.volume <= :volumeMax
        )`,
        { volumeMax },
      );
    }
    if (valueMin != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_forest_guide_species fgs
          WHERE fgs.forest_guide_id = gf.id AND fgs.value >= :valueMin
        )`,
        { valueMin },
      );
    }
    if (valueMax != null) {
      qb.andWhere(
        `EXISTS (
          SELECT 1 FROM public_app.semaspa_forest_guide_species fgs
          WHERE fgs.forest_guide_id = gf.id AND fgs.value <= :valueMax
        )`,
        { valueMax },
      );
    }
  }

  async findAll(query: GetForestGuidesQueryDto): Promise<GetForestGuidesResponseDto> {
    const { page = 1, limit = 20, sortBy = 'id', sortOrder = 'ASC' } = query;
    const skip = (page - 1) * limit;
    const safeSortBy = (FOREST_GUIDE_SORT_FIELDS as readonly string[]).includes(sortBy)
      ? sortBy
      : 'id';
    const safeSortOrder = sortOrder === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.forestGuideRepo.createQueryBuilder('gf');
    this.applyListFilters(qb, query);
    qb.orderBy(`gf.${safeSortBy}`, safeSortOrder).skip(skip).take(limit);

    const countQb = this.forestGuideRepo.createQueryBuilder('gf');
    this.applyListFilters(countQb, query);

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetForestGuidesResponseDto(
      rows.map((r) => new ForestGuideResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: number): Promise<ForestGuideResponseDto> {
    const entity = await this.forestGuideRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Forest guide ${id} not found`);
    }
    return new ForestGuideResponseDto(entity);
  }

  async findSpecies(
    forestGuideId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetForestGuideSpeciesResponseDto> {
    await this.assertExists(forestGuideId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.speciesRepo.findAndCount({
      where: { forestGuideId },
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });
    return new GetForestGuideSpeciesResponseDto(
      rows.map((r) => new ForestGuideSpeciesResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findRoles(
    forestGuideId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonRolesResponseDto> {
    await this.assertExists(forestGuideId);
    const { page = 1, limit = 20 } = query;
    const [rows, total] = await this.personRoleRepo.findAndCount({
      where: { entityType: 'GF', entityId: forestGuideId },
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

  async findAutefs(
    forestGuideId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetAutefsResponseDto> {
    await this.assertExists(forestGuideId);
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const qb = this.autefRepo
      .createQueryBuilder('autef')
      .innerJoin(SemaspaAutefForestGuide, 'bridge', 'bridge.autef_id = autef.id')
      .where('bridge.forest_guide_id = :forestGuideId', { forestGuideId })
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
      .orderBy('autef.id', 'ASC')
      .skip(skip)
      .take(limit);

    const countQb = this.autefForestGuideRepo
      .createQueryBuilder('bridge')
      .where('bridge.forestGuideId = :forestGuideId', { forestGuideId });

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetAutefsResponseDto(
      rows.map((r) => new AutefResponseDto(r)),
      page,
      limit,
      total,
    );
  }
}
