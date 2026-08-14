import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaSpeciesProduct } from '../../../model/entities/semaspa-species-product.view.entity';
import { GetSpeciesProductsQueryDto } from '../dto/get-species-products-query.dto';
import { SpeciesProductResponseDto } from '../dto/species-product-response.dto';
import { GetSpeciesProductsResponseDto } from '../../shared/paginated-responses.dto';

@Injectable()
export class SpeciesProductsService {
  constructor(
    @InjectRepository(SemaspaSpeciesProduct)
    private readonly speciesProductRepo: Repository<SemaspaSpeciesProduct>,
  ) {}

  async findAll(query: GetSpeciesProductsQueryDto): Promise<GetSpeciesProductsResponseDto> {
    const { page = 1, limit = 20, search, source } = query;
    const skip = (page - 1) * limit;

    const qb = this.speciesProductRepo.createQueryBuilder('sp');

    if (search) {
      qb.andWhere(
        `(sp.scientificName ILIKE :search
          OR sp.commonName ILIKE :search
          OR sp.productName ILIKE :search)`,
        { search: `%${search}%` },
      );
    }
    if (source) {
      qb.andWhere('sp.source = :source', { source });
    }

    qb.orderBy('sp.id', 'ASC').skip(skip).take(limit);

    const countQb = this.speciesProductRepo.createQueryBuilder('sp');
    if (search) {
      countQb.andWhere(
        `(sp.scientificName ILIKE :search
          OR sp.commonName ILIKE :search
          OR sp.productName ILIKE :search)`,
        { search: `%${search}%` },
      );
    }
    if (source) {
      countQb.andWhere('sp.source = :source', { source });
    }

    const [rows, total] = await Promise.all([qb.getMany(), countQb.getCount()]);
    return new GetSpeciesProductsResponseDto(
      rows.map((r) => new SpeciesProductResponseDto(r)),
      page,
      limit,
      total,
    );
  }

  async findOne(id: string): Promise<SpeciesProductResponseDto> {
    const entity = await this.speciesProductRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Species product ${id} not found`);
    }
    return new SpeciesProductResponseDto(entity);
  }
}
