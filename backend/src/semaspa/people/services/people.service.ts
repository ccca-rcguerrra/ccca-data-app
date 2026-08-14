import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SemaspaPerson } from '../../../model/entities/semaspa-person.view.entity';
import { SemaspaPersonRole } from '../../../model/entities/semaspa-person-role.view.entity';
import { GetPeopleQueryDto } from '../dto/get-people-query.dto';
import { PersonResponseDto } from '../dto/person-response.dto';
import { GetPeopleResponseDto, GetPersonRolesResponseDto } from '../../shared/paginated-responses.dto';
import { PersonRoleResponseDto } from '../../shared/person-role-response.dto';
import { SemaspaPaginationQueryDto } from '../../shared/semaspa-pagination.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(SemaspaPerson)
    private readonly personRepo: Repository<SemaspaPerson>,
    @InjectRepository(SemaspaPersonRole)
    private readonly personRoleRepo: Repository<SemaspaPersonRole>,
  ) {}

  async findAll(query: GetPeopleQueryDto): Promise<GetPeopleResponseDto> {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.personRepo.createQueryBuilder('person');

    if (search) {
      // names is text[]; cast to text for ILIKE search
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
    const exists = await this.personRepo.exist({ where: { id: personId } });
    if (!exists) {
      throw new NotFoundException(`Person ${personId} not found`);
    }
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
}
