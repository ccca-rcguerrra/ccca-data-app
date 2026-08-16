import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndicatorSavedFilter } from '../../../model/entities/indicator-saved-filter.entity';
import { ANY_INDICATOR_ID, isCatalogIndicatorId } from '../indicator-catalog';
import { GetIndicatorFiltersDto } from '../dto/get-indicator-filters.dto';
import {
  CreateSavedFilterDto,
  SavedFilterResponseDto,
  UpdateSavedFilterDto,
} from '../dto/saved-filter.dto';

@Injectable()
export class IndicatorSavedFiltersService {
  constructor(
    @InjectRepository(IndicatorSavedFilter)
    private readonly savedFilterRepo: Repository<IndicatorSavedFilter>,
  ) {}

  async findAll(userId: number): Promise<SavedFilterResponseDto[]> {
    const rows = await this.savedFilterRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => new SavedFilterResponseDto(row));
  }

  async create(
    userId: number,
    dto: CreateSavedFilterDto,
  ): Promise<SavedFilterResponseDto> {
    const saved = await this.savedFilterRepo.save(
      this.savedFilterRepo.create({
        userId,
        name: dto.name.trim(),
        indicatorId: this.normalizeIndicatorId(dto.indicatorId),
        filters: this.sanitizeFilters(dto.filters),
      }),
    );
    return new SavedFilterResponseDto(saved);
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateSavedFilterDto,
  ): Promise<SavedFilterResponseDto> {
    const entity = await this.requireOwned(userId, id);
    if (dto.name !== undefined) entity.name = dto.name.trim();
    if (dto.indicatorId !== undefined) {
      entity.indicatorId = this.normalizeIndicatorId(dto.indicatorId);
    }
    if (dto.filters !== undefined) {
      entity.filters = this.sanitizeFilters(dto.filters);
    }
    const saved = await this.savedFilterRepo.save(entity);
    return new SavedFilterResponseDto(saved);
  }

  async remove(userId: number, id: number): Promise<void> {
    const entity = await this.requireOwned(userId, id);
    await this.savedFilterRepo.remove(entity);
  }

  private async requireOwned(
    userId: number,
    id: number,
  ): Promise<IndicatorSavedFilter> {
    const entity = await this.savedFilterRepo.findOne({ where: { id, userId } });
    if (!entity) {
      throw new NotFoundException(`Saved filter ${id} not found`);
    }
    return entity;
  }

  private normalizeIndicatorId(id?: string | null): string | null {
    if (id == null || id.trim() === '' || id === ANY_INDICATOR_ID) {
      return null;
    }
    if (!isCatalogIndicatorId(id)) {
      throw new NotFoundException(`Indicator ${id} not found`);
    }
    return id;
  }

  private sanitizeFilters(
    filters: GetIndicatorFiltersDto = {},
  ): GetIndicatorFiltersDto {
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
    if (filters.commonName?.trim()) {
      echoed.commonName = filters.commonName.trim();
    }
    if (filters.movedRatioMin != null) {
      echoed.movedRatioMin = filters.movedRatioMin;
    }
    if (filters.movedRatioMax != null) {
      echoed.movedRatioMax = filters.movedRatioMax;
    }
    if (filters.excessVolumeMin != null) {
      echoed.excessVolumeMin = filters.excessVolumeMin;
    }
    return echoed;
  }
}
