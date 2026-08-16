import { NotFoundException } from '@nestjs/common';
import { IndicatorSavedFiltersService } from './indicator-saved-filters.service';
import { INDICATOR_IDS } from '../indicator-catalog';

describe('IndicatorSavedFiltersService', () => {
  const ownerId = 7;
  const otherUserId = 9;

  function createService(overrides: Record<string, unknown> = {}) {
    const repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((value: unknown) => value),
      save: jest.fn(async (value: unknown) => ({
        id: 1,
        createdAt: new Date('2026-08-16T00:00:00.000Z'),
        updatedAt: new Date('2026-08-16T00:00:00.000Z'),
        ...(value as object),
      })),
      remove: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    return {
      service: new IndicatorSavedFiltersService(repo as never),
      repo,
    };
  }

  it('lists only presets owned by the current user', async () => {
    const { service, repo } = createService({
      find: jest.fn().mockResolvedValue([
        {
          id: 1,
          userId: ownerId,
          name: 'Mine',
          indicatorId: null,
          filters: { city: 'Santarem' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    });

    const rows = await service.findAll(ownerId);
    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: ownerId },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('Mine');
  });

  it('stores any as a null indicator id', async () => {
    const { service, repo } = createService();
    await service.create(ownerId, {
      name: 'Volume any',
      indicatorId: 'any',
      filters: { city: '  Belem  ' },
    });
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: ownerId,
        indicatorId: null,
        filters: { city: 'Belem' },
      }),
    );
  });

  it('returns 404 when another user tries to patch or delete a preset', async () => {
    const { service, repo } = createService({
      findOne: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.update(otherUserId, 1, { name: 'Hijack' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(otherUserId, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: 1, userId: otherUserId },
    });
  });

  it('updates and deletes only when the owner matches', async () => {
    const owned = {
      id: 3,
      userId: ownerId,
      name: 'Old',
      indicatorId: INDICATOR_IDS.OVER_EXTRACTED,
      filters: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const { service, repo } = createService({
      findOne: jest.fn().mockResolvedValue(owned),
    });

    const updated = await service.update(ownerId, 3, {
      name: 'New',
      indicatorId: INDICATOR_IDS.PLATE_RECURRENT,
      filters: { state: 'PA' },
    });
    expect(updated.name).toBe('New');
    expect(updated.indicatorId).toBe(INDICATOR_IDS.PLATE_RECURRENT);
    expect(updated.filters).toEqual({ state: 'PA' });

    await service.remove(ownerId, 3);
    expect(repo.remove).toHaveBeenCalledWith(owned);
  });
});
