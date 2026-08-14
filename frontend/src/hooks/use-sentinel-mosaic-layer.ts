import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { endOfMonth, format, startOfMonth } from 'date-fns';
import type { MapLayerRef } from '@/components/map/types';
import { useSentinelMosaicMapLayerQuery } from '@/hooks/api/use-gee';
import type { SentinelVisualization } from '@/types/gee';
import type { MapTimelineMonth } from '@/utils/map-timeline';

/** Layer id used for the Sentinel-2 monthly mosaic TileLayer / LayerControlItem. */
export const SENTINEL_MOSAIC_LAYER_ID = 'sentinel-mosaic';

const DEFAULT_CLOUD_COVER_PCT = 30;
const DEFAULT_VISUALIZATION: SentinelVisualization = 'NATURAL_COLOR';

export interface UseSentinelMosaicLayerResult {
  /** True once the user activates the mosaic layer in the LayersControl. */
  isActive: boolean;
  /** Ref for the real TileLayer (the underlying MapLibre layer). */
  layerRef: React.RefObject<MapLayerRef | null>;
  /**
   * Proxy ref passed to LayerControlItem. Gates the (expensive) GEE fetch behind
   * user activation while letting LayersControl manage the checkbox normally.
   */
  controlRef: React.RefObject<MapLayerRef>;
  /** GEE tile URL template for the current month/params, or null while unresolved. */
  url: string | null;
  /** True while the mosaic tile for the current params is being fetched. */
  isLoading: boolean;
  /** Current cloud-cover threshold (0–100). */
  cloudCoverPct: number;
  /** Current visualization mode. */
  visualization: SentinelVisualization;
  /** Setters wired to the timeline slider callbacks. */
  setMonth: (month: MapTimelineMonth) => void;
  setGeometry: (geometry: GeoJSON.Geometry) => void;
  setCloudCoverPct: (pct: number) => void;
  setVisualization: (visualization: SentinelVisualization) => void;
}

/**
 * Shared Sentinel-2 monthly mosaic layer state for maps with a timeline slider.
 *
 * Owns the activation gating (proxy ref), the GEE map-layer query (only fetched
 * once the user enables the layer), and the month/cloud/visualization/geometry
 * inputs driven by {@link MapTimelineSlider}. Used by both the alert map and the
 * alerts management map.
 */
export function useSentinelMosaicLayer(): UseSentinelMosaicLayerResult {
  const [currentMonth, setCurrentMonth] = useState<MapTimelineMonth | null>(null);
  const [cloudCoverPct, setCloudCoverPct] = useState(DEFAULT_CLOUD_COVER_PCT);
  const [visualization, setVisualization] = useState<SentinelVisualization>(DEFAULT_VISUALIZATION);
  const [geometry, setGeometry] = useState<GeoJSON.Geometry | null>(null);

  // Tracks whether the user has enabled the Sentinel mosaic layer in LayersControl.
  const [isActive, setIsActive] = useState(false);
  // Mutable ref so the proxy closure always reads the current value without stale captures.
  const isActiveRef = useRef(false);
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Real TileLayer ref — connected to the actual MapLibre layer.
  const layerRef = useRef<MapLayerRef>(null);

  // Proxy ref passed to LayerControlItem. Intercepts create/destroy so we can gate
  // the GEE fetch behind user activation, while letting LayersControl manage the
  // checkbox state normally.
  const controlRef = useRef<MapLayerRef>({
    create: () => setIsActive(true),
    destroy: () => {
      setIsActive(false);
      // If the TileLayer is still mounted, destroy its underlying map layer immediately.
      layerRef.current?.destroy();
    },
    show: () => setIsActive(true),
    hide: () => setIsActive(false),
    setOpacity: (o) => layerRef.current?.setOpacity(o),
    getOpacity: () => layerRef.current?.getOpacity() ?? 1,
    // LayersControl reads isVisible() during its init sync — return our state so the
    // checkbox reflects the true activation state (not the underlying layer).
    isVisible: () => isActiveRef.current,
    // Always lazy so LayersControl initialises the checkbox as unchecked.
    isLazy: () => true,
    getLayerId: () => SENTINEL_MOSAIC_LAYER_ID,
  });

  const params = useMemo(() => {
    if (!currentMonth || !geometry) return null;
    return {
      startDate: format(startOfMonth(currentMonth.date), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(currentMonth.date), 'yyyy-MM-dd'),
      cloudCoverPercentage: cloudCoverPct,
      visualization,
      geometry,
      cloudMask: true,
    };
  }, [currentMonth, cloudCoverPct, visualization, geometry]);

  const { data, isFetching } = useSentinelMosaicMapLayerQuery(params, isActive && !!params);

  const setMonth = useCallback((month: MapTimelineMonth) => setCurrentMonth(month), []);
  const setGeometryCb = useCallback((g: GeoJSON.Geometry) => setGeometry(g), []);

  return {
    isActive,
    layerRef,
    controlRef,
    url: data?.urlFormat ?? null,
    isLoading: isFetching,
    cloudCoverPct,
    visualization,
    setMonth,
    setGeometry: setGeometryCb,
    setCloudCoverPct,
    setVisualization,
  };
}
