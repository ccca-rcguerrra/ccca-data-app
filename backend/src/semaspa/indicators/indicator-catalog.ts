export const INDICATOR_IDS = {
  OVER_EXTRACTED: 'autef_over_extracted',
  CREDIT_USE_OVER_90: 'autef_credit_use_over_90',
  UNIT_CONFLICT: 'autef_unit_conflict',
  PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS: 'person_multiple_over_extracted_autefs',
  PERSON_RECURRENT_GF_DESTINATION: 'person_recurrent_gf_destination',
  PLATE_RECURRENT: 'plate_recurrent',
  GF_PERMIT_UNPARSEABLE: 'gf_permit_unparseable',
  GF_PERMIT_UNMATCHED: 'gf_permit_unmatched',
} as const;

export const ANY_INDICATOR_ID = 'any' as const;

export const DISTINCT_CASE_THRESHOLD = 2;

export type CatalogIndicatorId =
  (typeof INDICATOR_IDS)[keyof typeof INDICATOR_IDS];

export type IndicatorQueryId = CatalogIndicatorId | typeof ANY_INDICATOR_ID;

export type IndicatorEntity = 'autef' | 'person' | 'plate' | 'gf';

export type IndicatorSeverity = 'informational';

export interface IndicatorDefinition {
  id: CatalogIndicatorId;
  name: string;
  entity: IndicatorEntity;
  severity: IndicatorSeverity;
  ruleVersion: number;
  inputs: string[];
  calculation: string;
  limitations: string[];
  sqlPredicate?: string;
}

const GF3_LIMITATION = 'GF3 volumes are excluded from the balance';
const UNIT_LIMITATION = 'Comparison depends on compatible units of measure';
const CREDIT_USE_LIMITATION =
  'Credit use at or above 90% is not an irregularity by itself';
const IDENTITY_LIMITATION = 'Person ID is a hash of CPF/CNPJ';
const PLATE_LIMITATION = 'Plates are compared after trim only; no further normalization';
const PERMIT_REF_LIMITATION =
  'GFs with an empty autorizacoes array are not exploded and do not appear here';
const PARSE_LIMITATION =
  'A reference is parseable only when it splits into number/year on a slash';

export const VOLUME_INDICATOR_IDS = [
  INDICATOR_IDS.OVER_EXTRACTED,
  INDICATOR_IDS.CREDIT_USE_OVER_90,
  INDICATOR_IDS.UNIT_CONFLICT,
] as const;

export const INDICATOR_CATALOG: readonly IndicatorDefinition[] = [
  {
    id: INDICATOR_IDS.OVER_EXTRACTED,
    name: 'Volume moved above authorized',
    entity: 'autef',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['autef', 'species_product', 'gf1'],
    calculation: 'moved_volume > authorized_volume',
    limitations: [GF3_LIMITATION, UNIT_LIMITATION],
    sqlPredicate: 'vb.is_over_extracted = true',
  },
  {
    id: INDICATOR_IDS.CREDIT_USE_OVER_90,
    name: 'Credit use at or above 90%',
    entity: 'autef',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['autef', 'species_product', 'gf1'],
    calculation: 'moved_ratio >= 0.9',
    limitations: [GF3_LIMITATION, UNIT_LIMITATION, CREDIT_USE_LIMITATION],
    sqlPredicate: 'vb.moved_ratio >= 0.9',
  },
  {
    id: INDICATOR_IDS.UNIT_CONFLICT,
    name: 'Volume unit conflict',
    entity: 'autef',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['autef', 'species_product', 'gf1'],
    calculation: 'authorized_unit is incompatible with moved_unit',
    limitations: [GF3_LIMITATION, UNIT_LIMITATION],
    sqlPredicate: 'vb.has_unit_conflict = true',
  },
  {
    id: INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS,
    name: 'Person on multiple over-extracted AUTEFs',
    entity: 'person',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['person', 'person_role', 'autef', 'species_product', 'gf1'],
    calculation:
      'COUNT(DISTINCT over-extracted AUTEF) >= 2 for owner or technical responsible',
    limitations: [GF3_LIMITATION, UNIT_LIMITATION, IDENTITY_LIMITATION],
  },
  {
    id: INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION,
    name: 'Recurrent GF destination of over-extracted AUTEFs',
    entity: 'person',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['person', 'person_role', 'forest_guide', 'autef', 'gf1'],
    calculation:
      'COUNT(DISTINCT GF as DESTINO_GF linked to over-extracted AUTEFs) >= 2',
    limitations: [GF3_LIMITATION, UNIT_LIMITATION, IDENTITY_LIMITATION],
  },
  {
    id: INDICATOR_IDS.PLATE_RECURRENT,
    name: 'Plate recurrent across over-extracted AUTEFs',
    entity: 'plate',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['plate', 'forest_guide', 'autef', 'gf1'],
    calculation:
      'COUNT(DISTINCT over-extracted AUTEF linked via GFs carrying the plate) >= 2',
    limitations: [GF3_LIMITATION, PLATE_LIMITATION],
  },
  {
    id: INDICATOR_IDS.GF_PERMIT_UNPARSEABLE,
    name: 'Forest guide with an unparseable AUTEF reference',
    entity: 'gf',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['forest_guide', 'permit_reference'],
    calculation: 'GF has at least one declared AUTEF reference with match_status = unparseable',
    limitations: [PERMIT_REF_LIMITATION, PARSE_LIMITATION],
  },
  {
    id: INDICATOR_IDS.GF_PERMIT_UNMATCHED,
    name: 'Forest guide with an unmatched AUTEF reference',
    entity: 'gf',
    severity: 'informational',
    ruleVersion: 1,
    inputs: ['forest_guide', 'permit_reference', 'autef'],
    calculation: 'GF has at least one parseable AUTEF reference with match_status = unmatched',
    limitations: [PERMIT_REF_LIMITATION, PARSE_LIMITATION],
  },
];

const CATALOG_BY_ID = new Map(
  INDICATOR_CATALOG.map((indicator) => [indicator.id, indicator]),
);

export function isCatalogIndicatorId(id: string): id is CatalogIndicatorId {
  return CATALOG_BY_ID.has(id as CatalogIndicatorId);
}

export function isIndicatorQueryId(id: string): id is IndicatorQueryId {
  return id === ANY_INDICATOR_ID || isCatalogIndicatorId(id);
}

export function isVolumeIndicatorQuery(id: IndicatorQueryId): boolean {
  return (
    id === ANY_INDICATOR_ID ||
    (VOLUME_INDICATOR_IDS as readonly string[]).includes(id)
  );
}

export function getCatalogIndicator(
  id: string,
): IndicatorDefinition | undefined {
  return CATALOG_BY_ID.get(id as CatalogIndicatorId);
}

export function catalogEntity(id: IndicatorQueryId): IndicatorEntity {
  if (id === ANY_INDICATOR_ID) return 'autef';
  return getCatalogIndicator(id)!.entity;
}

export function isGfIndicatorQuery(id: IndicatorQueryId): boolean {
  return catalogEntity(id) === 'gf';
}

export function indicatorBalancePredicate(
  id: IndicatorQueryId,
  alias = 'vb',
): string {
  if (id === ANY_INDICATOR_ID) {
    return (
      `(${alias}.is_over_extracted = true` +
      ` OR ${alias}.moved_ratio >= 0.9` +
      ` OR ${alias}.has_unit_conflict = true)`
    );
  }

  const predicate = getCatalogIndicator(id)?.sqlPredicate;
  if (!predicate) {
    throw new Error(`Indicator ${id} has no volume-balance predicate`);
  }
  return predicate.replace(/\bvb\./g, `${alias}.`);
}
