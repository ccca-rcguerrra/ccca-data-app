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
    });
  });
});

function unusedRepo(): never {
  return {} as never;
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
      createQueryBuilder: jest.fn(() => {
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
        qb.getRawMany = jest.fn().mockResolvedValue([]);
        return qb;
      }),
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
  });
});
