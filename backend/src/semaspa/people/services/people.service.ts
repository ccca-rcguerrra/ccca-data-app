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
import { mapPersonParticipation } from '../person-participation';

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

    const [roleRows, typeRows] = await Promise.all([
      roleQb.getRawMany<{ role: string; count: string | number }>(),
      typeQb.getRawMany<{ entity_type: string; count: string | number }>(),
    ]);

    return mapPersonParticipation(roleRows, typeRows);
  }

  async findAutefs(
    personId: string,
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonLinkedAutefsResponseDto> {
    await this.assertPersonExists(personId);
    const { page = 1, limit = 20 } = query;
    const [roles, total] = await this.personRoleRepo.findAndCount({
      where: { personId, entityType: 'AUTEF' },
      skip: (page - 1) * limit,
      take: limit,
      order: { entityId: 'ASC', role: 'ASC' },
    });

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
    query: SemaspaPaginationQueryDto,
  ): Promise<GetPersonLinkedForestGuidesResponseDto> {
    await this.assertPersonExists(personId);
    const { page = 1, limit = 20 } = query;
    const [roles, total] = await this.personRoleRepo.findAndCount({
      where: { personId, entityType: 'GF' },
      skip: (page - 1) * limit,
      take: limit,
      order: { entityId: 'ASC', role: 'ASC' },
    });

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
}
