import { NotFoundException } from '@nestjs/common';
import { AutefsService } from './autefs.service';
import {
  buildVolumeBalancesCsvBody,
  resolveVolumeBalanceSort,
} from '../volume-balance-csv';
import {
  applyVolumeBalanceGfScope,
  mapVolumeBalanceForestGuideRow,
  VOLUME_BALANCE_GF_STATUSES,
  VOLUME_BALANCE_GF_TYPE,
} from '../volume-balance-gf-scope';
import { buildCreditTimeline } from '../volume-balance-timeline';

describe('resolveVolumeBalanceSort', () => {
  it('defaults to excessVolume DESC', () => {
    expect(resolveVolumeBalanceSort({})).toEqual({
      sortBy: 'excessVolume',
      sortOrder: 'DESC',
    });
  });

  it('falls back to excessVolume DESC for an unknown sort field', () => {
    expect(
      resolveVolumeBalanceSort({
        sortBy: 'notAField' as never,
        sortOrder: 'ASC',
      }),
    ).toEqual({
      sortBy: 'excessVolume',
      sortOrder: 'DESC',
    });
  });

  it('accepts a valid sort field and order', () => {
    expect(
      resolveVolumeBalanceSort({ sortBy: 'movedRatio', sortOrder: 'ASC' }),
    ).toEqual({
      sortBy: 'movedRatio',
      sortOrder: 'ASC',
    });
  });
});

describe('buildVolumeBalancesCsvBody', () => {
  it('includes comment headers for autef id, grain, and GF1 scope', () => {
    const body = buildVolumeBalancesCsvBody(497, '2026-08-16T00:00:00.000Z', []);
    expect(body).toContain('# autef_id=497');
    expect(body).toContain('# grain=species_product');
    expect(body).toContain('# gf_scope=GF1');
    expect(body).toContain('# generated_at=2026-08-16T00:00:00.000Z');
  });
});

describe('applyVolumeBalanceGfScope', () => {
  it('filters GF1 and accepted statuses used by the volume-balance mart', () => {
    const andWhere = jest.fn();
    applyVolumeBalanceGfScope({ andWhere });
    expect(andWhere).toHaveBeenCalledWith('gf.type = :gfType', {
      gfType: VOLUME_BALANCE_GF_TYPE,
    });
    expect(andWhere).toHaveBeenCalledWith('gf.status IN (:...gfStatuses)', {
      gfStatuses: [...VOLUME_BALANCE_GF_STATUSES],
    });
    expect(VOLUME_BALANCE_GF_TYPE).toBe('GF1');
    expect(VOLUME_BALANCE_GF_STATUSES).toEqual([
      'AGUARDANDO_RECEBIMENTO',
      'ATIVO',
      'RECEBIDO',
      'RECEBIDO_VENCIDO',
    ]);
  });
});

describe('mapVolumeBalanceForestGuideRow', () => {
  it('maps raw columns to the contribution DTO', () => {
    expect(
      mapVolumeBalanceForestGuideRow({
        forest_guide_id: '1717533',
        number: '1717533',
        issued_at: '2024-01-15T00:00:00.000Z',
        status: 'ATIVO',
        type: 'GF1',
        volume: '12.5',
        unit: 'M3',
        species_product_id: 'c58688845974af07c441d6d3e74e4c4b',
      }),
    ).toEqual({
      forestGuideId: 1717533,
      number: '1717533',
      issuedAt: '2024-01-15T00:00:00.000Z',
      status: 'ATIVO',
      type: 'GF1',
      volume: 12.5,
      unit: 'M3',
      speciesProductId: 'c58688845974af07c441d6d3e74e4c4b',
      runningTotal: 0,
    });
  });
});

describe('buildCreditTimeline', () => {
  it('returns empty totals and no crossing for an empty list', () => {
    expect(buildCreditTimeline([], 500)).toEqual({
      runningTotals: new Map(),
      crossingForestGuideId: null,
    });
  });

  it('does not mark a crossing when the only GF stays at or below authorized', () => {
    const result = buildCreditTimeline([{ forestGuideId: 1, volume: 199.6 }], 199.87);
    expect(result.runningTotals.get(1)).toBe(199.6);
    expect(result.crossingForestGuideId).toBeNull();
  });

  it('does not mark a crossing when running total equals authorized', () => {
    const result = buildCreditTimeline([{ forestGuideId: 1, volume: 500 }], 500);
    expect(result.crossingForestGuideId).toBeNull();
  });

  it('marks the first GF when it already exceeds authorized', () => {
    const result = buildCreditTimeline([{ forestGuideId: 84, volume: 570 }], 500);
    expect(result.runningTotals.get(84)).toBe(570);
    expect(result.crossingForestGuideId).toBe(84);
  });

  it('marks the later GF that first exceeds authorized (GF084 crosses 500)', () => {
    const result = buildCreditTimeline(
      [
        { forestGuideId: 1, volume: 100 },
        { forestGuideId: 19, volume: 130 },
        { forestGuideId: 42, volume: 160 },
        { forestGuideId: 84, volume: 180 },
        { forestGuideId: 102, volume: 165 },
      ],
      500,
    );
    expect([...result.runningTotals.values()]).toEqual([100, 230, 390, 570, 735]);
    expect(result.crossingForestGuideId).toBe(84);
  });

  it('treats null volumes as zero and skips a crossing when authorized is null', () => {
    const withNulls = buildCreditTimeline(
      [
        { forestGuideId: 1, volume: null },
        { forestGuideId: 2, volume: 10 },
      ],
      5,
    );
    expect(withNulls.runningTotals.get(1)).toBe(0);
    expect(withNulls.runningTotals.get(2)).toBe(10);
    expect(withNulls.crossingForestGuideId).toBe(2);

    const noAuthorized = buildCreditTimeline(
      [{ forestGuideId: 1, volume: 999 }],
      null,
    );
    expect(noAuthorized.crossingForestGuideId).toBeNull();
    expect(noAuthorized.runningTotals.get(1)).toBe(999);
  });
});

function unusedRepo(): never {
  return {} as never;
}

function createForestGuideRepoMock(andWhereCalls: Array<[string, unknown]>) {
  return {
    createQueryBuilder: jest.fn(() => {
      const qb: Record<string, unknown> = {};
      const self = () => qb;
      qb.innerJoin = jest.fn(self);
      qb.where = jest.fn(self);
      qb.andWhere = jest.fn((sql: string, params?: unknown) => {
        andWhereCalls.push([sql, params]);
        return qb;
      });
      qb.select = jest.fn(self);
      qb.addSelect = jest.fn(self);
      qb.orderBy = jest.fn(self);
      qb.addOrderBy = jest.fn(self);
      qb.skip = jest.fn(self);
      qb.take = jest.fn(self);
      qb.getRawMany = jest.fn().mockResolvedValue([]);
      qb.getRawOne = jest.fn().mockResolvedValue({ count: '0', sum: '0' });
      qb.limit = jest.fn(self);
      return qb;
    }),
  };
}

describe('AutefsService', () => {
  it('throws NotFoundException when exporting CSV for a missing AUTEF', async () => {
    const autefRepo = { exist: jest.fn().mockResolvedValue(false) };
    const unused = unusedRepo();
    const service = new AutefsService(
      autefRepo as never,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
    );

    await expect(service.exportVolumeBalancesCsv(999, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.findVolumeBalances(999, {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      service.findVolumeBalanceForestGuides(999, 'any', {}),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty contribution list for an unknown species-product', async () => {
    const andWhereCalls: Array<[string, unknown]> = [];
    const autefRepo = { exist: jest.fn().mockResolvedValue(true) };
    const unused = unusedRepo();
    const volumeBalanceRepo = { findOne: jest.fn().mockResolvedValue(null) };
    const service = new AutefsService(
      autefRepo as never,
      unused,
      volumeBalanceRepo as never,
      unused,
      unused,
      createForestGuideRepoMock(andWhereCalls) as never,
      unused,
      unused,
    );

    const result = await service.findVolumeBalanceForestGuides(
      497,
      'missing-species-product',
      {},
    );

    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
    expect(result.movedVolumeSum).toBe(0);
    expect(result.crossingForestGuideId).toBeNull();
    expect(andWhereCalls).toEqual(
      expect.arrayContaining([
        [
          'fgs.species_product_id = :speciesProductId',
          { speciesProductId: 'missing-species-product' },
        ],
        ['gf.type = :gfType', { gfType: VOLUME_BALANCE_GF_TYPE }],
        [
          'gf.status IN (:...gfStatuses)',
          { gfStatuses: [...VOLUME_BALANCE_GF_STATUSES] },
        ],
      ]),
    );
  });
});
