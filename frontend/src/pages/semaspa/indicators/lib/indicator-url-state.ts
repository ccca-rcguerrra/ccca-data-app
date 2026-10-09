import { INDICATOR_IDS, type CatalogIndicatorId } from '@/types/semaspa';

const CATALOG_IDS = new Set<string>(Object.values(INDICATOR_IDS));

export function isCatalogIndicatorId(id: string): id is CatalogIndicatorId {
  return CATALOG_IDS.has(id);
}

export interface IndicatorUrlSnapshot {
  selectedIndicatorId: CatalogIndicatorId | null;
}

export function parseIndicatorSearchParams(
  searchParams: URLSearchParams,
): IndicatorUrlSnapshot {
  const rawIndicator = searchParams.get('indicator')?.trim() ?? '';
  const selectedIndicatorId =
    rawIndicator && isCatalogIndicatorId(rawIndicator) ? rawIndicator : null;

  return { selectedIndicatorId };
}
