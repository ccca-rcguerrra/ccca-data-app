import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEntity } from '../../model/entities/domain.entity';
import { CreateDomainDto } from '../dto/create-domain.dto';
import { UpdateDomainDto } from '../dto/update-domain.dto';
import { GetDomainsQueryDto } from '../dto/get-domains-query.dto';
import { GetDomainsResponseDto } from '../dto/get-domains-response.dto';
import { DomainResponseDto } from '../dto/domain-response.dto';
import { DOMAIN_EVENTS, DomainCreatedEvent, DomainUpdatedEvent } from '../events/domain.events';

@Injectable()
export class DomainService {
  constructor(
    @InjectRepository(DomainEntity)
    private readonly repository: Repository<DomainEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: GetDomainsQueryDto): Promise<GetDomainsResponseDto> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.repository.createQueryBuilder('domain');

    if (search) {
      qb.andWhere('domain.name ILIKE :search', { search: `%${search}%` });
    }

    const [data, total] = await qb
      .orderBy('domain.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const items = data.map((entity) => new DomainResponseDto(entity));
    return new GetDomainsResponseDto(items, page, limit, total);
  }

  async findOne(id: number): Promise<DomainResponseDto> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Domain ${id} not found`);
    }
    return new DomainResponseDto(entity);
  }

  async create(dto: CreateDomainDto): Promise<DomainResponseDto> {
    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);

    const event = new DomainCreatedEvent();
    event.id = saved.id;
    this.eventEmitter.emit(DOMAIN_EVENTS.CREATED, event);

    return new DomainResponseDto(saved);
  }

  async update(id: number, dto: UpdateDomainDto): Promise<DomainResponseDto> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Domain ${id} not found`);
    }

    Object.assign(entity, dto);
    const saved = await this.repository.save(entity);

    const event = new DomainUpdatedEvent();
    event.id = saved.id;
    this.eventEmitter.emit(DOMAIN_EVENTS.UPDATED, event);

    return new DomainResponseDto(saved);
  }

  async remove(id: number): Promise<void> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Domain ${id} not found`);
    }
    await this.repository.remove(entity);
  }
}
