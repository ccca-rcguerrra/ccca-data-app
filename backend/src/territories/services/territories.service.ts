import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentTerritoryView } from '../../model/entities/current-territory.view.entity';
import { GetTerritoriesQueryDto } from '../dto/get-territories-query.dto';
import { GetTerritoriesResponseDto } from '../dto/get-territories-response.dto';
import { TerritoryResponseDto } from '../dto/territory-response.dto';

@Injectable()
export class TerritoriesService {
  constructor(
    @InjectRepository(CurrentTerritoryView)
    private readonly currentTerritoryRepository: Repository<CurrentTerritoryView>,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Category priority for name-search ranking, per initiative.
   * Comes from AppConfig (territories.alertFilters) so ORDER BY only references
   * values that exist in this initiative's territory_category enum.
   */
  private getSearchCategoryPriority(): string[] {
    const categories = this.configService.get<string[]>(
      'appConfig.territories.alertFilters',
    );

    return categories && categories.length > 0
      ? categories
      : ['state', 'city', 'refined_biome'];
  }

  /**
   * Extract a bounding box ([west, south, east, north]) from a raw row produced
   * by the `withBbox` selects, or null when any coordinate is missing/invalid.
   */
  private static toBbox(raw: Record<string, unknown> | undefined): TerritoryResponseDto['bbox'] {
    if (!raw) return null;
    const w = Number(raw.bbox_w);
    const s = Number(raw.bbox_s);
    const e = Number(raw.bbox_e);
    const n = Number(raw.bbox_n);
    if ([w, s, e, n].some(v => !Number.isFinite(v))) return null;
    return [w, s, e, n];
  }

  /**
   * Accent-insensitive name search (and optional exact id match when numeric).
   * Uses Postgres `unaccent`, same approach as public territory views.
   */
  private applySearchFilter(
    queryBuilder: ReturnType<Repository<CurrentTerritoryView>['createQueryBuilder']>,
    search?: string,
  ): void {
    if (!search) return;

    const searchNumber = Number(search);
    const isNumeric = !isNaN(searchNumber) && isFinite(searchNumber);
    const searchName = `%${search}%`;

    if (isNumeric) {
      queryBuilder.andWhere(
        '(territory.id = :searchId OR lower(unaccent(territory.name)) LIKE lower(unaccent(:searchName)))',
        { searchId: searchNumber, searchName },
      );
      return;
    }

    queryBuilder.andWhere(
      'lower(unaccent(territory.name)) LIKE lower(unaccent(:searchName))',
      { searchName },
    );
  }

  /**
   * When searching by name, rank better matches first so short/exact names
   * (e.g. state "Pará") are not buried under cities that merely contain the term.
   * Without search, keep stable id ordering.
   */
  private applySearchOrdering(
    queryBuilder: ReturnType<Repository<CurrentTerritoryView>['createQueryBuilder']>,
    search?: string,
  ): void {
    const term = search?.trim();
    if (!term || (!isNaN(Number(term)) && isFinite(Number(term)))) {
      queryBuilder.orderBy('territory.id', 'ASC');
      return;
    }

    const categories = this.getSearchCategoryPriority();
    const categoryCaseSql = [
      'CASE territory.category::text',
      ...categories.map((_, i) => `WHEN :rankCat${i} THEN ${i}`),
      `ELSE ${categories.length}`,
      'END',
    ].join('\n');

    queryBuilder
      .orderBy(
        `CASE
          WHEN lower(unaccent(territory.name)) = lower(unaccent(:rankExact)) THEN 0
          WHEN lower(unaccent(territory.name)) LIKE lower(unaccent(:rankPrefix)) THEN 1
          ELSE 2
        END`,
        'ASC',
      )
      .addOrderBy(categoryCaseSql, 'ASC')
      .addOrderBy('length(territory.name)', 'ASC')
      .addOrderBy('territory.name', 'ASC')
      .setParameter('rankExact', term)
      .setParameter('rankPrefix', `${term}%`);

    categories.forEach((cat, i) => {
      queryBuilder.setParameter(`rankCat${i}`, cat);
    });
  }

  private applyCategoryFilter(
    queryBuilder: ReturnType<Repository<CurrentTerritoryView>['createQueryBuilder']>,
    category?: string[],
  ): void {
    if (!category || category.length === 0) return;
    queryBuilder.andWhere('territory.category IN (:...categories)', { categories: category });
  }

  async findAll(
    queryDto: GetTerritoriesQueryDto,
  ): Promise<GetTerritoriesResponseDto> {
    const { page = 1, limit = 10, search, category, withGeom = false, withBbox = false } = queryDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.currentTerritoryRepository
      .createQueryBuilder('territory')
      .select([
        'territory.id',
        'territory.version',
        'territory.name',
        'territory.category',
        'territory.categoryName',
        'territory.source',
        'territory.areaHa',
        'territory.enabled',
      ]);

    if (withGeom === true) {
      queryBuilder.addSelect([
        'territory.geometry',
        'territory.oldGeometry',
      ]);
    }

    if (withBbox === true) {
      queryBuilder
        .addSelect('ST_XMin(ST_Envelope(territory.geom))', 'bbox_w')
        .addSelect('ST_YMin(ST_Envelope(territory.geom))', 'bbox_s')
        .addSelect('ST_XMax(ST_Envelope(territory.geom))', 'bbox_e')
        .addSelect('ST_YMax(ST_Envelope(territory.geom))', 'bbox_n');
    }

    this.applySearchFilter(queryBuilder, search);
    this.applyCategoryFilter(queryBuilder, category);
    this.applySearchOrdering(queryBuilder, search);

    const countQueryBuilder = this.currentTerritoryRepository
      .createQueryBuilder('territory');

    this.applySearchFilter(countQueryBuilder, search);
    this.applyCategoryFilter(countQueryBuilder, category);

    queryBuilder
      .skip(skip)
      .take(limit);

    const [result, total] = await Promise.all([
      withBbox === true
        ? queryBuilder.getRawAndEntities()
        : queryBuilder.getMany().then(entities => ({ entities, raw: [] as Record<string, unknown>[] })),
      countQueryBuilder.getCount(),
    ]);

    const territories = result.entities;
    const raw = result.raw;

    const territoriesDto: TerritoryResponseDto[] = territories.map((territory, index) => {
      const dto: Partial<TerritoryResponseDto> = {
        id: territory.id,
        version: territory.version,
        name: territory.name,
        category: territory.category,
        categoryName: territory.categoryName || null,
        source: territory.source,
        areaHa: territory.areaHa || null,
        enabled: territory.enabled ?? true,
      };

      if (withGeom === true) {
        dto.geometry = territory.geometry || null;
      }

      if (withBbox === true) {
        dto.bbox = TerritoriesService.toBbox(raw[index]);
      }

      return dto as TerritoryResponseDto;
    });

    return new GetTerritoriesResponseDto(territoriesDto, page, limit, total);
  }

  async findOne(id: number, withBbox = false): Promise<TerritoryResponseDto> {
    if (withBbox !== true) {
      const territory = await this.currentTerritoryRepository.findOne({ where: { id } });
      return territory as TerritoryResponseDto;
    }

    // Lightweight path: scalar fields + computed bounding box, without the heavy geometry.
    const { entities, raw } = await this.currentTerritoryRepository
      .createQueryBuilder('territory')
      .select([
        'territory.id',
        'territory.version',
        'territory.name',
        'territory.category',
        'territory.categoryName',
        'territory.source',
        'territory.areaHa',
        'territory.enabled',
      ])
      .addSelect('ST_XMin(ST_Envelope(territory.geom))', 'bbox_w')
      .addSelect('ST_YMin(ST_Envelope(territory.geom))', 'bbox_s')
      .addSelect('ST_XMax(ST_Envelope(territory.geom))', 'bbox_e')
      .addSelect('ST_YMax(ST_Envelope(territory.geom))', 'bbox_n')
      .where('territory.id = :id', { id })
      .getRawAndEntities();

    const territory = entities[0];
    if (!territory) return null as unknown as TerritoryResponseDto;

    const dto: Partial<TerritoryResponseDto> = {
      id: territory.id,
      version: territory.version,
      name: territory.name,
      category: territory.category,
      categoryName: territory.categoryName || null,
      source: territory.source,
      areaHa: territory.areaHa || null,
      enabled: territory.enabled ?? true,
      bbox: TerritoriesService.toBbox(raw[0]),
    };

    return dto as TerritoryResponseDto;
  }
}
