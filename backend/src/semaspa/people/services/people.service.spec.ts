import { NotFoundException } from '@nestjs/common';
import { PeopleService } from './people.service';
import {
  emptyPersonParticipation,
  mapPersonParticipation,
} from '../person-participation';

describe('mapPersonParticipation', () => {
  it('returns zeros for empty rows', () => {
    expect(mapPersonParticipation([], [])).toEqual(emptyPersonParticipation());
  });

  it('maps distinct counts by role and entity type', () => {
    expect(
      mapPersonParticipation(
        [
          { role: 'PROPRIETARIO', count: '12' },
          { role: 'RESPONSAVEL_TECNICO', count: 4 },
          { role: 'ORIGEM_GF', count: '155' },
        ],
        [
          { entity_type: 'AUTEF', count: '14' },
          { entityType: 'GF', count: 310 },
        ],
      ),
    ).toEqual({
      ownerAutefCount: 12,
      technicalResponsibleAutefCount: 4,
      analystAutefCount: 0,
      originGfCount: 155,
      destinationGfCount: 0,
      distinctAutefCount: 14,
      distinctGfCount: 310,
      overExtractedAutefCount: 0,
      unitConflictAutefCount: 0,
      creditUseOver90AutefCount: 0,
      recurrentDestinationGfCount: 0,
      associatedPlateCount: 0,
      associatedPlateSample: null,
    });
  });
});

function unusedRepo(): never {
  return {} as never;
}

function createRoleQueryBuilder(selects: string[]) {
  const qb: Record<string, unknown> = {};
  const self = () => qb;
  qb.select = jest.fn((sql: string) => {
    selects.push(sql);
    return qb;
  });
  qb.addSelect = jest.fn((sql: string) => {
    selects.push(sql);
    return qb;
  });
  qb.where = jest.fn(self);
  qb.andWhere = jest.fn(self);
  qb.groupBy = jest.fn(self);
  qb.innerJoin = jest.fn(self);
  qb.orderBy = jest.fn(self);
  qb.addOrderBy = jest.fn(self);
  qb.skip = jest.fn(self);
  qb.take = jest.fn(self);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawOne = jest.fn().mockResolvedValue({ count: 0, sample: null });
  qb.getMany = jest.fn().mockResolvedValue([]);
  return qb;
}

describe('PeopleService', () => {
  it('throws NotFoundException when the person is missing', async () => {
    const personRepo = { exist: jest.fn().mockResolvedValue(false) };
    const unused = unusedRepo();
    const service = new PeopleService(
      personRepo as never,
      unused,
      unused,
      unused,
    );

    await expect(service.findParticipation('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findAutefs('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findForestGuides('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns empty participation and lists when the person has no roles', async () => {
    const personRepo = { exist: jest.fn().mockResolvedValue(true) };
    const selects: string[] = [];
    const personRoleRepo = {
      createQueryBuilder: jest.fn(() => createRoleQueryBuilder(selects)),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const unused = unusedRepo();

    const service = new PeopleService(
      personRepo as never,
      personRoleRepo as never,
      unused,
      unused,
    );

    await expect(service.findParticipation('person-1')).resolves.toEqual(
      emptyPersonParticipation(),
    );
    const autefs = await service.findAutefs('person-1', {});
    const guides = await service.findForestGuides('person-1', {});
    expect(autefs.total).toBe(0);
    expect(autefs.data).toEqual([]);
    expect(guides.total).toBe(0);
    expect(guides.data).toEqual([]);
    expect(selects.some((sql) => sql.includes('COUNT(DISTINCT pr.entityId)'))).toBe(
      true,
    );
    expect(selects.some((sql) => sql.includes('COUNT(DISTINCT pr.entity_id)'))).toBe(
      true,
    );
    expect(selects.some((sql) => sql.includes('COUNT(DISTINCT plate_row.plate)'))).toBe(
      true,
    );
  });

  it('counts a single over-extracted AUTEF without a recurrence threshold', async () => {
    const personRepo = { exist: jest.fn().mockResolvedValue(true) };
    const selects: string[] = [];
    const personRoleRepo = {
      createQueryBuilder: jest.fn(() => {
        const qb = createRoleQueryBuilder(selects);
        (qb.getRawMany as jest.Mock).mockResolvedValue([]);
        (qb.getRawOne as jest.Mock).mockImplementation(() => {
          const lastSelect = selects[selects.length - 1] ?? '';
          if (lastSelect.includes('COUNT(DISTINCT pr.entity_id)')) {
            return Promise.resolve({ count: '1' });
          }
          return Promise.resolve({ count: 0, sample: null });
        });
        return qb;
      }),
    };

    const service = new PeopleService(
      personRepo as never,
      personRoleRepo as never,
      unusedRepo(),
      unusedRepo(),
    );

    const participation = await service.findParticipation('person-1');
    expect(participation.overExtractedAutefCount).toBe(1);
    expect(selects.join('\n')).not.toContain('>= 2');
  });
});
