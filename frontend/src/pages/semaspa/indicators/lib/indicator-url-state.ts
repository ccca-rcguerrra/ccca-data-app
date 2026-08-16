import {
  ANY_INDICATOR_ID,
  INDICATOR_IDS,
  type CatalogIndicatorId,
  type IndicatorFilters,
} from '@/types/semaspa';

import {
  type IndicatorCenterFilters,
  initialIndicatorFilters,
} from '../store/use-indicators-store';

export const INDICATOR_URL_FILTER_KEYS = [
  'city',
  'state',
  'issuedFrom',
  'issuedTo',
  'scientificName',
  'commonName',
  'speciesProductId',
  'movedRatioMin',
  'movedRatioMax',
  'excessVolumeMin',
] as const;

const CATALOG_IDS = new Set<string>(Object.values(INDICATOR_IDS));

export function isCatalogIndicatorId(id: string): id is CatalogIndicatorId {
  return CATALOG_IDS.has(id);
}

export interface IndicatorUrlSnapshot {
  selectedIndicatorId: CatalogIndicatorId | null;
  filters: IndicatorCenterFilters;
}

export function parseIndicatorSearchParams(
  searchParams: URLSearchParams,
): IndicatorUrlSnapshot {
  const rawIndicator = searchParams.get('indicator')?.trim() ?? '';
  const selectedIndicatorId =
    rawIndicator && isCatalogIndicatorId(rawIndicator) ? rawIndicator : null;

  const filters: IndicatorCenterFilters = { ...initialIndicatorFilters };
  for (const key of INDICATOR_URL_FILTER_KEYS) {
    const value = searchParams.get(key);
    if (value != null) filters[key] = value;
  }

  return { selectedIndicatorId, filters };
}

export function buildIndicatorSearchParams(
  selectedIndicatorId: CatalogIndicatorId | null,
  filters: IndicatorCenterFilters,
): URLSearchParams {
  const next = new URLSearchParams();
  if (selectedIndicatorId) next.set('indicator', selectedIndicatorId);
  for (const key of INDICATOR_URL_FILTER_KEYS) {
    const value = filters[key]?.trim();
    if (value) next.set(key, value);
  }
  return next;
}

export function indicatorSearchParamsEqual(
  left: URLSearchParams,
  right: URLSearchParams,
): boolean {
  return left.toString() === right.toString();
}

export function toApiFilters(filters: IndicatorCenterFilters): IndicatorFilters {
  return {
    city: filters.city.trim() || undefined,
    state: filters.state.trim() || undefined,
    issuedFrom: filters.issuedFrom || undefined,
    issuedTo: filters.issuedTo || undefined,
    scientificName: filters.scientificName.trim() || undefined,
    commonName: filters.commonName.trim() || undefined,
    speciesProductId: filters.speciesProductId.trim() || undefined,
    movedRatioMin: parseOptionalFloat(filters.movedRatioMin),
    movedRatioMax: parseOptionalFloat(filters.movedRatioMax),
    excessVolumeMin: parseOptionalFloat(filters.excessVolumeMin),
  };
}

export function fromApiFilters(filters: IndicatorFilters): IndicatorCenterFilters {
  return {
    ...initialIndicatorFilters,
    city: filters.city ?? '',
    state: filters.state ?? '',
    issuedFrom: filters.issuedFrom ?? '',
    issuedTo: filters.issuedTo ?? '',
    scientificName: filters.scientificName ?? '',
    commonName: filters.commonName ?? '',
    speciesProductId: filters.speciesProductId ?? '',
    movedRatioMin:
      filters.movedRatioMin != null ? String(filters.movedRatioMin) : '',
    movedRatioMax:
      filters.movedRatioMax != null ? String(filters.movedRatioMax) : '',
    excessVolumeMin:
      filters.excessVolumeMin != null ? String(filters.excessVolumeMin) : '',
  };
}

export function savedIndicatorIdToSelection(
  indicatorId: string | null | undefined,
): CatalogIndicatorId | null {
  if (!indicatorId || indicatorId === ANY_INDICATOR_ID) return null;
  return isCatalogIndicatorId(indicatorId) ? indicatorId : null;
}

function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}
