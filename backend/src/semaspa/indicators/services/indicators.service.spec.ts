import { NotFoundException } from '@nestjs/common';
import { IndicatorsService } from './indicators.service';
import { INDICATOR_IDS } from '../indicator-catalog';

describe('IndicatorsService', () => {
  const unused = {} as never;
  const service = new IndicatorsService(unused, unused, unused);

  it('throws NotFoundException for unknown indicator ids', async () => {
    await expect(service.findCases('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.exportCasesCsv('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects grouped-case lookup when repositories are missing', async () => {
    await expect(
      service.findCases(INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS, {}),
    ).rejects.toThrow();
    await expect(
      service.findCases(INDICATOR_IDS.PLATE_RECURRENT, {}),
    ).rejects.toThrow();
  });

  it('queries person cases with COUNT DISTINCT and threshold 2', async () => {
    const havings: string[] = [];
    const selects: string[] = [];
    const listQb: Record<string, unknown> = {};
    const self = () => listQb;
    listQb.innerJoin = jest.fn(self);
    listQb.where = jest.fn(self);
    listQb.andWhere = jest.fn(self);
    listQb.select = jest.fn((sql: string) => {
      selects.push(sql);
      return listQb;
    });
    listQb.addSelect = jest.fn((sql: string) => {
      selects.push(sql);
      return listQb;
    });
    listQb.groupBy = jest.fn(self);
    listQb.addGroupBy = jest.fn(self);
    listQb.having = jest.fn((sql: string) => {
      havings.push(sql);
      return listQb;
    });
    listQb.setParameters = jest.fn(self);
    listQb.orderBy = jest.fn(self);
    listQb.addOrderBy = jest.fn(self);
    listQb.offset = jest.fn(self);
    listQb.limit = jest.fn(self);
    listQb.getQuery = jest.fn(() => 'SELECT 1');
    listQb.getParameters = jest.fn(() => ({ threshold: 2 }));
    listQb.getRawMany = jest.fn().mockResolvedValue([
      {
        personId: 'p1',
        names: ['ACME'],
        distinctAutefCount: 3,
        distinctGfCount: 0,
      },
    ]);

    const countQb: Record<string, unknown> = {};
    const countSelf = () => countQb;
    countQb.select = jest.fn(countSelf);
    countQb.from = jest.fn(countSelf);
    countQb.setParameters = jest.fn(countSelf);
    countQb.getRawOne = jest.fn().mockResolvedValue({ count: 1 });

    const personRepo = {
      createQueryBuilder: jest.fn(() => listQb),
      manager: { createQueryBuilder: jest.fn(() => countQb) },
    };
    const grouped = new IndicatorsService(
      unused,
      personRepo as never,
      unused,
    );

    const result = await grouped.findCases(
      INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS,
      {},
    );
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      entity: 'person',
      personId: 'p1',
      distinctAutefCount: 3,
    });
    expect(havings.some((sql) => sql.includes('COUNT(DISTINCT pr.entity_id)'))).toBe(
      true,
    );
    expect(selects.some((sql) => sql.includes('COUNT(DISTINCT pr.entity_id)'))).toBe(
      true,
    );
  });

  it('queries plate cases from unnested GF plates with threshold 2', async () => {
    const havings: string[] = [];
    const joins: string[] = [];
    const listQb: Record<string, unknown> = {};
    const self = () => listQb;
    listQb.select = jest.fn(self);
    listQb.addSelect = jest.fn(self);
    listQb.innerJoin = jest.fn((table: unknown) => {
      joins.push(typeof table === 'string' ? table : String(table));
      return listQb;
    });
    listQb.groupBy = jest.fn(self);
    listQb.having = jest.fn((sql: string) => {
      havings.push(sql);
      return listQb;
    });
    listQb.setParameters = jest.fn(self);
    listQb.orderBy = jest.fn(self);
    listQb.addOrderBy = jest.fn(self);
    listQb.offset = jest.fn(self);
    listQb.limit = jest.fn(self);
    listQb.getQuery = jest.fn(() => 'SELECT 1');
    listQb.getParameters = jest.fn(() => ({ threshold: 2 }));
    listQb.getRawMany = jest.fn().mockResolvedValue([
      { plate: 'ABC1D23', distinctGfCount: 4, distinctAutefCount: 2 },
    ]);

    const countQb: Record<string, unknown> = {};
    const countSelf = () => countQb;
    countQb.select = jest.fn(countSelf);
    countQb.from = jest.fn(countSelf);
    countQb.setParameters = jest.fn(countSelf);
    countQb.getRawOne = jest.fn().mockResolvedValue({ count: 1 });

    const personRepo = {
      manager: { createQueryBuilder: jest.fn(() => countQb) },
    };
    const forestGuideRepo = {
      createQueryBuilder: jest.fn(() => listQb),
    };
    const grouped = new IndicatorsService(
      unused,
      personRepo as never,
      forestGuideRepo as never,
    );

    const result = await grouped.findCases(INDICATOR_IDS.PLATE_RECURRENT, {});
    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      entity: 'plate',
      plate: 'ABC1D23',
      distinctAutefCount: 2,
    });
    expect(joins.some((sql) => sql.includes('unnest('))).toBe(true);
    expect(
      havings.some((sql) => sql.includes('COUNT(DISTINCT flagged.autef_id)')),
    ).toBe(true);
  });
});
