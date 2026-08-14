import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaAutefVolumeBalance } from '../../../model/entities/semaspa-autef-volume-balance.view.entity';
import { GetAutefVolumeBalancesQueryDto } from '../dto/get-autef-volume-balances-query.dto';
import { AutefVolumeBalanceResponseDto } from '../dto/autef-volume-balance-response.dto';
import { GetAutefVolumeBalancesResponseDto } from '../../shared/paginated-responses.dto';

@Injectable()
export class AutefVolumeBalancesService {
  constructor(
    @InjectRepository(SemaspaAutefVolumeBalance)
    private readonly volumeBalanceRepo: Repository<SemaspaAutefVolumeBalance>,
  ) {}

  async findAll(
    query: GetAutefVolumeBalancesQueryDto,
  ): Promise<GetAutefVolumeBalancesResponseDto> {
    const {
      page = 1,
      limit = 20,
      autefId,
      speciesProductId,
      isOverExtracted,
      hasUnitConflict,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.volumeBalanceRepo.createQueryBuilder('vb');

    if (autefId != null) {
      qb.andWhere('vb.autefId = :autefId', { autefId });
    }
    if (speciesProductId) {
      qb.andWhere('vb.speciesProductId = :speciesProductId', { speciesProductId });
    }
    if (isOverExtracted != null) {
      qb.andWhere('vb.isOverExtracted = :isOverExtracted', { isOverExtracted });
    }
    if (hasUnitConflict != null) {
      qb.andWhere('vb.hasUnitConflict = :hasUnitConflict', { hasUnitConflict });
    }

    qb.orderBy('vb.id', 'ASC').skip(skip).take(limit);

    const countQb = this.volumeBalanceRepo.createQueryBuilder('vb');
    if (autefId != null) {
      countQb.andWhere('vb.autefId = :autefId', { autefId });
    }
    if (speciesProductId) {
      countQb.andWhere('vb.speciesProductId = :speciesProductId', { speciesProductId });
    }
    if (isOverExtracted != null) {
      countQb.andWhere('vb.isOverExtracted = :isOverExtracted', { isOverExtracted });
    }
    if (hasUnitConflict != null) {
      countQb.andWhere('vb.hasUnitConflict = :hasUnitConflict', { hasUnitConflict });
    }

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetAutefVolumeBalancesResponseDto(
      rows.map((r) => new AutefVolumeBalanceResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string): Promise<AutefVolumeBalanceResponseDto> {
    const entity = await this.volumeBalanceRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Volume balance ${id} not found`);
    }
    return new AutefVolumeBalanceResponseDto(entity);
  }
}
