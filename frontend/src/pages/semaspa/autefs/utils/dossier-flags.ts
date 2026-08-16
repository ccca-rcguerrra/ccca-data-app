import { INDICATOR_IDS, type AutefVolumeBalance, type CatalogIndicatorId } from '@/types/semaspa';

export const NO_MOVEMENT_FLAG_ID = 'autef_no_movement' as const;

export type DossierFlagId = CatalogIndicatorId | typeof NO_MOVEMENT_FLAG_ID;

export interface DossierFlags {
  isOverExtracted: boolean;
  hasCreditUseOver90: boolean;
  hasUnitConflict: boolean;
  hasNoMovement: boolean;
  peakMovedRatio: number | null;
  maxExcessVolume: number | null;
  balanceRowCount: number;
  overExtractedCount: number;
  activeFlagIds: DossierFlagId[];
}

export function deriveDossierFlags(
  balances: AutefVolumeBalance[],
  balancesLoaded: boolean,
): DossierFlags {
  let peakMovedRatio: number | null = null;
  let maxExcessVolume: number | null = null;
  let overExtractedCount = 0;
  let hasCreditUseOver90 = false;
  let hasUnitConflict = false;
  let hasMovement = false;

  for (const row of balances) {
    if (row.isOverExtracted) overExtractedCount += 1;
    if (row.hasUnitConflict) hasUnitConflict = true;
    if (row.movedRatio != null && !Number.isNaN(row.movedRatio) && row.movedRatio >= 0.9) {
      hasCreditUseOver90 = true;
    }
    if (row.movedVolume != null && row.movedVolume > 0) hasMovement = true;
    if (row.movedRatio != null && !Number.isNaN(row.movedRatio)) {
      peakMovedRatio =
        peakMovedRatio == null ? row.movedRatio : Math.max(peakMovedRatio, row.movedRatio);
    }
    if (row.excessVolume != null && !Number.isNaN(row.excessVolume)) {
      maxExcessVolume =
        maxExcessVolume == null
          ? row.excessVolume
          : Math.max(maxExcessVolume, row.excessVolume);
    }
  }

  const isOverExtracted = overExtractedCount > 0;
  const hasNoMovement = balancesLoaded && !hasMovement;

  const activeFlagIds: DossierFlagId[] = [];
  if (isOverExtracted) activeFlagIds.push(INDICATOR_IDS.OVER_EXTRACTED);
  if (hasCreditUseOver90) activeFlagIds.push(INDICATOR_IDS.CREDIT_USE_OVER_90);
  if (hasUnitConflict) activeFlagIds.push(INDICATOR_IDS.UNIT_CONFLICT);
  if (hasNoMovement) activeFlagIds.push(NO_MOVEMENT_FLAG_ID);

  return {
    isOverExtracted,
    hasCreditUseOver90,
    hasUnitConflict,
    hasNoMovement,
    peakMovedRatio,
    maxExcessVolume,
    balanceRowCount: balances.length,
    overExtractedCount,
    activeFlagIds,
  };
}
