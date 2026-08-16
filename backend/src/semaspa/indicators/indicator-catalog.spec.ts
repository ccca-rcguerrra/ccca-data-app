import {
  ANY_INDICATOR_ID,
  DISTINCT_CASE_THRESHOLD,
  INDICATOR_CATALOG,
  INDICATOR_IDS,
  catalogEntity,
  getCatalogIndicator,
  indicatorBalancePredicate,
  isCatalogIndicatorId,
  isIndicatorQueryId,
  isVolumeIndicatorQuery,
} from './indicator-catalog';
import {
  mapAutefCase,
  mapPersonCase,
  mapPlateCase,
  toRequiredCount,
} from './indicator-case-map';

describe('indicator catalog', () => {
  it('exposes stable catalog ids including person and plate indicators', () => {
    expect(INDICATOR_CATALOG.map((item) => item.id)).toEqual([
      INDICATOR_IDS.OVER_EXTRACTED,
      INDICATOR_IDS.CREDIT_USE_OVER_90,
      INDICATOR_IDS.UNIT_CONFLICT,
      INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS,
      INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION,
      INDICATOR_IDS.PLATE_RECURRENT,
    ]);
  });

  it('keeps volume indicators on autef and new indicators on person/plate', () => {
    expect(getCatalogIndicator(INDICATOR_IDS.OVER_EXTRACTED)?.entity).toBe(
      'autef',
    );
    expect(
      getCatalogIndicator(INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS)
        ?.entity,
    ).toBe('person');
    expect(
      getCatalogIndicator(INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION)?.entity,
    ).toBe('person');
    expect(getCatalogIndicator(INDICATOR_IDS.PLATE_RECURRENT)?.entity).toBe(
      'plate',
    );
    expect(catalogEntity(ANY_INDICATOR_ID)).toBe('autef');
    expect(isVolumeIndicatorQuery(ANY_INDICATOR_ID)).toBe(true);
    expect(isVolumeIndicatorQuery(INDICATOR_IDS.OVER_EXTRACTED)).toBe(true);
    expect(
      isVolumeIndicatorQuery(INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS),
    ).toBe(false);
  });

  it('keeps every catalog entry informational with rule version 1', () => {
    for (const indicator of INDICATOR_CATALOG) {
      expect(indicator.severity).toBe('informational');
      expect(indicator.ruleVersion).toBe(1);
      expect(indicator.limitations.length).toBeGreaterThan(0);
      expect(indicator.calculation.length).toBeGreaterThan(0);
    }
  });

  it('returns catalog entries by id and undefined for unknown ids', () => {
    expect(getCatalogIndicator(INDICATOR_IDS.OVER_EXTRACTED)?.calculation).toBe(
      'moved_volume > authorized_volume',
    );
    expect(getCatalogIndicator('unknown')).toBeUndefined();
    expect(isCatalogIndicatorId(INDICATOR_IDS.UNIT_CONFLICT)).toBe(true);
    expect(isCatalogIndicatorId(ANY_INDICATOR_ID)).toBe(false);
    expect(isIndicatorQueryId(ANY_INDICATOR_ID)).toBe(true);
    expect(isIndicatorQueryId('missing')).toBe(false);
  });

  it('builds SQL predicates only for volume-balance flags and the any union', () => {
    expect(indicatorBalancePredicate(INDICATOR_IDS.OVER_EXTRACTED)).toBe(
      'vb.is_over_extracted = true',
    );
    expect(indicatorBalancePredicate(INDICATOR_IDS.CREDIT_USE_OVER_90)).toBe(
      'vb.moved_ratio >= 0.9',
    );
    expect(indicatorBalancePredicate(INDICATOR_IDS.UNIT_CONFLICT)).toBe(
      'vb.has_unit_conflict = true',
    );
    expect(indicatorBalancePredicate(ANY_INDICATOR_ID)).toBe(
      '(vb.is_over_extracted = true OR vb.moved_ratio >= 0.9 OR vb.has_unit_conflict = true)',
    );
    expect(indicatorBalancePredicate(INDICATOR_IDS.OVER_EXTRACTED, 'bal')).toBe(
      'bal.is_over_extracted = true',
    );
    expect(() =>
      indicatorBalancePredicate(INDICATOR_IDS.PLATE_RECURRENT),
    ).toThrow(/no volume-balance predicate/);
  });
});

describe('person and plate case mapping', () => {
  it('maps distinct counts and requires the shared threshold of 2', () => {
    expect(DISTINCT_CASE_THRESHOLD).toBe(2);
    expect(
      mapPersonCase({
        personId: 'abc',
        names: ['ACME'],
        tax_id: '123',
        distinct_autef_count: '4',
        distinct_gf_count: 0,
      }),
    ).toEqual({
      entity: 'person',
      personId: 'abc',
      names: ['ACME'],
      taxId: '123',
      city: null,
      state: null,
      roleTypes: null,
      distinctAutefCount: 4,
      distinctGfCount: 0,
    });
    expect(
      mapPlateCase({
        plate: ' abc1d23 ',
        distinctGfCount: '9',
        distinctAutefCount: 3,
      }),
    ).toEqual({
      entity: 'plate',
      plate: 'abc1d23',
      distinctGfCount: 9,
      distinctAutefCount: 3,
    });
    expect(toRequiredCount('2') >= DISTINCT_CASE_THRESHOLD).toBe(true);
    expect(toRequiredCount(1) >= DISTINCT_CASE_THRESHOLD).toBe(false);
  });

  it('maps autef volume cases with entity autef', () => {
    expect(
      mapAutefCase({
        autefId: 497,
        number: '274729',
        has_over_extracted: true,
        has_credit_use_over_90: false,
        has_unit_conflict: false,
      }).entity,
    ).toBe('autef');
  });
});
