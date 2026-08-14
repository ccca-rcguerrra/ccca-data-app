import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaHarvestUnit } from '../../../model/entities/semaspa-harvest-unit.view.entity';
import { GetHarvestUnitsQueryDto } from '../dto/get-harvest-units-query.dto';
import { HarvestUnitResponseDto } from '../dto/harvest-unit-response.dto';
import { GetHarvestUnitsResponseDto } from '../../shared/paginated-responses.dto';

@Injectable()
export class HarvestUnitsService {
  constructor(
    @InjectRepository(SemaspaHarvestUnit)
    private readonly harvestUnitRepo: Repository<SemaspaHarvestUnit>,
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

  async findAll(query: GetHarvestUnitsQueryDto): Promise<GetHarvestUnitsResponseDto> {
    const {
      page = 1,
      limit = 20,
      search,
      city,
      withGeom = false,
      withBbox = false,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.harvestUnitRepo.createQueryBuilder('hu').select([
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
    ]);

    if (withGeom) {
      qb.addSelect('hu.geometry');
    }
    if (withBbox) {
      qb
        .addSelect('ST_XMin(ST_Envelope(hu.geom))', 'bbox_w')
        .addSelect('ST_YMin(ST_Envelope(hu.geom))', 'bbox_s')
        .addSelect('ST_XMax(ST_Envelope(hu.geom))', 'bbox_e')
        .addSelect('ST_YMax(ST_Envelope(hu.geom))', 'bbox_n');
    }

    if (search) {
      qb.andWhere(
        `(hu.propertyName ILIKE :search
          OR hu.holder ILIKE :search
          OR hu.processNumber ILIKE :search)`,
        { search: `%${search}%` },
      );
    }
    if (city) {
      qb.andWhere('hu.city ILIKE :city', { city: `%${city}%` });
    }

    qb.orderBy('hu.id', 'ASC').skip(skip).take(limit);

    const countQb = this.harvestUnitRepo.createQueryBuilder('hu');
    if (search) {
      countQb.andWhere(
        `(hu.propertyName ILIKE :search
          OR hu.holder ILIKE :search
          OR hu.processNumber ILIKE :search)`,
        { search: `%${search}%` },
      );
    }
    if (city) {
      countQb.andWhere('hu.city ILIKE :city', { city: `%${city}%` });
    }

    const [result, total] = await Promise.all([
      withBbox
        ? qb.getRawAndEntities()
        : qb.getMany().then((entities) => ({ entities, raw: [] as Record<string, unknown>[] })),
      countQb.getCount(),
    ]);

    const data = result.entities.map(
      (entity, i) =>
        new HarvestUnitResponseDto(entity, {
          withGeom,
          bbox: withBbox ? HarvestUnitsService.toBbox(result.raw[i]) : undefined,
        }),
    );

    return new GetHarvestUnitsResponseDto(data, page, limit, total);
  }

  async findOne(
    id: number,
    options: { withGeom?: boolean; withBbox?: boolean } = {},
  ): Promise<HarvestUnitResponseDto> {
    const { withGeom = false, withBbox = false } = options;

    if (!withBbox) {
      const qb = this.harvestUnitRepo.createQueryBuilder('hu').where('hu.id = :id', { id });
      if (!withGeom) {
        qb.select([
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
        ]);
      }
      const entity = await qb.getOne();
      if (!entity) {
        throw new NotFoundException(`Harvest unit ${id} not found`);
      }
      return new HarvestUnitResponseDto(entity, { withGeom });
    }

    const qb = this.harvestUnitRepo
      .createQueryBuilder('hu')
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
      .addSelect('ST_XMin(ST_Envelope(hu.geom))', 'bbox_w')
      .addSelect('ST_YMin(ST_Envelope(hu.geom))', 'bbox_s')
      .addSelect('ST_XMax(ST_Envelope(hu.geom))', 'bbox_e')
      .addSelect('ST_YMax(ST_Envelope(hu.geom))', 'bbox_n')
      .where('hu.id = :id', { id });

    if (withGeom) {
      qb.addSelect('hu.geometry');
    }

    const { entities, raw } = await qb.getRawAndEntities();
    if (!entities[0]) {
      throw new NotFoundException(`Harvest unit ${id} not found`);
    }
    return new HarvestUnitResponseDto(entities[0], {
      withGeom,
      bbox: HarvestUnitsService.toBbox(raw[0]),
    });
  }
}
