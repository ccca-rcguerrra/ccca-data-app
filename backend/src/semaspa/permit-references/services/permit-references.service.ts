import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { SemaspaForestGuidePermitReference } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';
import { GetPermitReferencesQueryDto } from '../dto/get-permit-references-query.dto';
import { PermitReferenceResponseDto } from '../dto/permit-reference-response.dto';
import { GetPermitReferencesResponseDto } from '../../shared/paginated-responses.dto';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';
import type { PermitReferenceMatchStatus } from '../../../model/entities/semaspa-forest-guide-permit-reference.view.entity';

@Injectable()
export class PermitReferencesService {
  constructor(
    @InjectRepository(SemaspaForestGuidePermitReference)
    private readonly permitRefRepo: Repository<SemaspaForestGuidePermitReference>,
    @InjectRepository(SemaspaForestGuide)
    private readonly forestGuideRepo: Repository<SemaspaForestGuide>,
  ) {}

  async findAll(
    query: GetPermitReferencesQueryDto,
  ): Promise<GetPermitReferencesResponseDto> {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const listQb = this.createBaseQuery();
    this.applyFilters(listQb, query);
    listQb
      .addSelect('gf.issuedAt')
      .orderBy('gf.issuedAt', 'DESC', 'NULLS LAST')
      .addOrderBy('ref.rawReference', 'ASC')
      .offset(skip)
      .limit(limit);

    const countQb = this.createBaseQuery();
    this.applyFilters(countQb, query);

    const [rows, total] = await Promise.all([
      listQb.getMany(),
      countQb.getCount(),
    ]);

    const data = await this.hydrate(rows);
    return new GetPermitReferencesResponseDto(data, page, limit, total);
  }

  async findByForestGuideId(
    forestGuideId: number,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPermitReferencesResponseDto> {
    const exists = await this.forestGuideRepo.exist({
      where: { id: forestGuideId },
    });
    if (!exists) {
      throw new NotFoundException(`Forest guide ${forestGuideId} not found`);
    }

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const [rows, total] = await this.permitRefRepo.findAndCount({
      where: { forestGuideId },
      skip,
      take: limit,
      order: { rawReference: 'ASC' },
    });
    const data = await this.hydrate(rows);
    return new GetPermitReferencesResponseDto(data, page, limit, total);
  }

  private createBaseQuery(): SelectQueryBuilder<SemaspaForestGuidePermitReference> {
    return this.permitRefRepo
      .createQueryBuilder('ref')
      .innerJoin(SemaspaForestGuide, 'gf', 'gf.id = ref.forest_guide_id');
  }

  private applyFilters(
    qb: SelectQueryBuilder<SemaspaForestGuidePermitReference>,
    query: GetPermitReferencesQueryDto,
  ): void {
    if (query.matchStatus) {
      qb.andWhere('ref.match_status = :matchStatus', {
        matchStatus: query.matchStatus,
      });
    }
    if (query.issuedFrom) {
      qb.andWhere('gf.issuedAt >= :issuedFrom', {
        issuedFrom: query.issuedFrom,
      });
    }
    if (query.issuedTo) {
      qb.andWhere('gf.issuedAt <= :issuedTo', { issuedTo: query.issuedTo });
    }
    if (query.type?.trim()) {
      qb.andWhere('gf.type = :type', { type: query.type.trim() });
    }
    if (query.search?.trim()) {
      qb.andWhere('ref.raw_reference ILIKE :search', {
        search: `%${query.search.trim()}%`,
      });
    }
    if (query.multiple) {
      qb.andWhere(
        `ref.forest_guide_id IN (
          SELECT multi.forest_guide_id
          FROM public_app.semaspa_forest_guide_permit_references multi
          GROUP BY multi.forest_guide_id
          HAVING COUNT(*) > 1
        )`,
      );
    }
  }

  private async hydrate(
    rows: SemaspaForestGuidePermitReference[],
  ): Promise<PermitReferenceResponseDto[]> {
    if (rows.length === 0) return [];

    const forestGuideIds = [...new Set(rows.map((row) => row.forestGuideId))];
    const autefIds = [
      ...new Set(
        rows
          .map((row) => row.autefId)
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    ];

    const [guides, autefs] = await Promise.all([
      this.forestGuideRepo
        .createQueryBuilder('gf')
        .select(['gf.id', 'gf.number', 'gf.type', 'gf.issuedAt'])
        .where('gf.id IN (:...forestGuideIds)', { forestGuideIds })
        .getMany(),
      autefIds.length === 0
        ? Promise.resolve([])
        : this.forestGuideRepo.manager
            .getRepository(SemaspaAutef)
            .createQueryBuilder('autef')
            .select(['autef.id', 'autef.number'])
            .where('autef.id IN (:...autefIds)', { autefIds })
            .getMany(),
    ]);

    const guideById = new Map(guides.map((guide) => [guide.id, guide]));
    const autefById = new Map(autefs.map((autef) => [autef.id, autef]));

    return rows.map((row) => {
      const guide = guideById.get(row.forestGuideId);
      const autef = row.autefId != null ? autefById.get(row.autefId) : undefined;
      const dto = new PermitReferenceResponseDto();
      dto.id = row.id;
      dto.forestGuideId = row.forestGuideId;
      dto.forestGuideNumber = guide?.number ?? null;
      dto.type = guide?.type ?? null;
      dto.issuedAt = guide?.issuedAt ?? null;
      dto.rawReference = row.rawReference;
      dto.parsedNumber = row.parsedNumber;
      dto.parsedYear = row.parsedYear;
      dto.matchStatus = row.matchStatus as PermitReferenceMatchStatus;
      dto.autefId = row.autefId;
      dto.autefNumber = autef?.number ?? null;
      return dto;
    });
  }
}
