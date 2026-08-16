export const VOLUME_BALANCE_TIMELINE_ROW_LIMIT = 1_000;

export interface CreditTimelineRow {
  forestGuideId: number;
  volume: number | null;
}

export function buildCreditTimeline(
  rows: CreditTimelineRow[],
  authorizedVolume: number | null,
): {
  runningTotals: Map<number, number>;
  crossingForestGuideId: number | null;
} {
  const runningTotals = new Map<number, number>();
  let running = 0;
  let crossingForestGuideId: number | null = null;

  for (const row of rows) {
    running += row.volume ?? 0;
    runningTotals.set(row.forestGuideId, running);
    if (
      crossingForestGuideId == null &&
      authorizedVolume != null &&
      running > authorizedVolume
    ) {
      crossingForestGuideId = row.forestGuideId;
    }
  }

  return { runningTotals, crossingForestGuideId };
}
