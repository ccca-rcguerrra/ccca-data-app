import { useCallback, useMemo, useState } from 'react';
import { useSentinelTimelineSummaryQuery } from '@/hooks/api/use-gee';
import type { SentinelTimelineSummaryParams, TimelineSummaryPoint } from '@/types/gee';

/** Effective month range emitted by the timeline slider (period bounds). */
export interface TimelineSummaryRange {
  startDate: string; // YYYY-MM-DD (first day of first month)
  endDate: string; // YYYY-MM-DD (last day of last month)
}

export interface UseSentinelTimelineSummaryResult {
  /** True once the user opens the data strip in the timeline slider. */
  isActive: boolean;
  /** Per-period NDVI + cloud + count points, or null while unresolved/inactive. */
  summary: TimelineSummaryPoint[] | null;
  /** True while the summary for the current params is being fetched. */
  isLoading: boolean;
  /** Toggles the (expensive) GEE fetch — wired to the slider's data-strip toggle. */
  setActive: (active: boolean) => void;
  /** Sets the visible month range — wired to the slider's onRangeChange. */
  setRange: (range: TimelineSummaryRange) => void;
}

/**
 * Lazy Sentinel-2 timeline summary state for a map with a timeline slider.
 *
 * Mirrors {@link useSentinelMosaicLayer}: the GEE query is only fetched once the
 * user opens the data strip (`isActive`), and is keyed by the visible month range
 * plus the AOI geometry. Use the TIGHT alert polygon as `geometry` (not the 10 km
 * mosaic buffer) so the NDVI signal reflects the alert area, not the forest around it.
 * @param opts.geometry - AOI for NDVI/cloud aggregation (tight alert polygon)
 */
export function useSentinelTimelineSummary(opts: {
  geometry: GeoJSON.Geometry | null;
}): UseSentinelTimelineSummaryResult {
  const { geometry } = opts;

  const [isActive, setIsActive] = useState(false);
  const [range, setRange] = useState<TimelineSummaryRange | null>(null);

  const params = useMemo<SentinelTimelineSummaryParams | null>(() => {
    if (!geometry || !range) return null;
    return {
      startDate: range.startDate,
      endDate: range.endDate,
      geometry,
      temporalResolution: 'month',
    };
  }, [geometry, range]);

  const { data, isFetching } = useSentinelTimelineSummaryQuery(params, isActive && !!params);

  const setActive = useCallback((active: boolean) => setIsActive(active), []);

  // Ignore no-op range emissions so the query key stays stable across re-renders.
  const setRangeCb = useCallback((next: TimelineSummaryRange) => {
    setRange((prev) =>
      prev && prev.startDate === next.startDate && prev.endDate === next.endDate ? prev : next
    );
  }, []);

  return {
    isActive,
    summary: data?.summary ?? null,
    isLoading: isFetching,
    setActive,
    setRange: setRangeCb,
  };
}
