import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { Map as MapLibreMap } from 'maplibre-gl';
import { BarChart3, Cloud, Layers, Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/shadcn/slider';
import { cn } from '@/lib/utils';
import { getMapBoundsGeometry } from '@/lib/maps/map-bounds';
import { MapTimelineDataStrip } from '@/components/map/map-timeline-data-strip';
import type { MapLayerRef } from '@/components/map/types';
import type { SentinelVisualization, TimelineSummaryPoint } from '@/types/gee';
import {
  buildMapTimelineModel,
  clampMonthString,
  getTimelineMaxMonth,
  TIMELINE_MIN_MONTH,
  type MapTimelineMarkerInput,
  type MapTimelineMonth,
} from '@/utils/map-timeline';

/** Visual style + legend label for a marker kind. */
export interface MapTimelineMarkerStyle {
  /** Tailwind background class for the dot, e.g. `bg-[#e0e63b]`. */
  dot: string;
  /** Tailwind ring class for the dot halo, e.g. `ring-[#e0e63b]/40`. */
  ring: string;
  /** Legend label shown beneath the track. */
  legend: string;
}

const FALLBACK_MARKER_STYLE: MapTimelineMarkerStyle = {
  dot: 'bg-foreground/60',
  ring: 'ring-foreground/20',
  legend: 'Marker',
};

export interface MapTimelineSliderProps {
  /** Markers to place on the track. Dates with no value are dropped. */
  markers?: MapTimelineMarkerInput[];
  /** Style/legend per marker `kind`. Unknown kinds fall back to a neutral style. */
  markerStyles?: Record<string, MapTimelineMarkerStyle>;
  /** Month the slider starts on. Falls back to the last month when omitted. */
  defaultDate?: string | Date | null;
  /** Default (pre-override) range end. Falls back to the current month. */
  defaultRangeEnd?: string | Date | null;
  /** Area of interest for mosaic queries. Falls back to the map viewport bounds when null. */
  geometry?: GeoJSON.Geometry | null;
  /** Map instance used to derive viewport bounds when `geometry` is null. */
  map?: MapLibreMap | null;
  onMonthChange?: (month: MapTimelineMonth) => void;
  /** Fires when the effective mosaic geometry changes (explicit geometry or map bounds). */
  onGeometryChange?: (geometry: GeoJSON.Geometry) => void;
  /** Called when the user commits a new cloud-cover threshold (0–100). Fires on slider release, not on every drag step. */
  onCloudFilterChange?: (cloudCoverPercentage: number) => void;
  /** Called when the user selects a different mosaic visualization mode. */
  onVisualizationChange?: (visualization: SentinelVisualization) => void;
  /** Ref to the Sentinel mosaic TileLayer — for LayerControlItem registration */
  layerRef?: React.RefObject<MapLayerRef | null>;
  /** Shows a loading spinner on the slider while the mosaic tile is being fetched */
  isLoadingMosaic?: boolean;
  /** Per-period NDVI/cloud/count points for the data heatmap (driven by the parent). */
  summary?: TimelineSummaryPoint[] | null;
  /** Spinner on the data strip while the summary is being fetched. */
  isLoadingSummary?: boolean;
  /** Fires when the effective month range changes — parent uses it to fetch the summary. */
  onRangeChange?: (range: { startDate: string; endDate: string }) => void;
  /** Fires when the user opens/closes the data strip — parent uses it to gate the (expensive) summary fetch. */
  onDataStripToggle?: (active: boolean) => void;
  className?: string;
}

const DEFAULT_CLOUD_PCT = 30;
const CLOUD_OPTIONS = [5, 10, 20, 30, 50, 80, 100];

const DEFAULT_VISUALIZATION: SentinelVisualization = 'NATURAL_COLOR';
const VISUALIZATION_OPTIONS: { value: SentinelVisualization; label: string }[] = [
  { value: 'NATURAL_COLOR', label: 'Natural color' },
  { value: 'FALSE_COLOR', label: 'False color' },
  { value: 'NDVI', label: 'NDVI' },
  { value: 'SWIR', label: 'SWIR' },
  { value: 'NDMI', label: 'NDMI' },
];

/**
 * Generic month/year timeline overlay for a MapLibre map, driving Sentinel-2
 * monthly mosaic queries. Markers, default range and start month are caller-driven,
 * so it works both for an alert-anchored map and a free viewport browse.
 */
export function MapTimelineSlider({
  markers: markerInputs,
  markerStyles,
  defaultDate,
  defaultRangeEnd,
  geometry = null,
  map = null,
  onMonthChange,
  onGeometryChange,
  onCloudFilterChange,
  onVisualizationChange,
  // `layerRef` is consumed by the parent (LayerControlItem registration), not here.
  isLoadingMosaic = false,
  summary,
  isLoadingSummary = false,
  onRangeChange,
  onDataStripToggle,
  className,
}: MapTimelineSliderProps) {
  const [cloudPct, setCloudPct] = useState(DEFAULT_CLOUD_PCT);
  const [visualization, setVisualization] = useState<SentinelVisualization>(DEFAULT_VISUALIZATION);
  const [dataStripOpen, setDataStripOpen] = useState(false);
  const [mapBoundsGeometry, setMapBoundsGeometry] = useState<GeoJSON.Geometry | null>(null);
  // "YYYY-MM" strings — null means use the auto-computed default
  const [rangeStartOverride, setRangeStartOverride] = useState<string | null>(null);
  const [rangeEndOverride, setRangeEndOverride] = useState<string | null>(null);

  useEffect(() => {
    if (geometry || !map) {
      setMapBoundsGeometry(null);
      return;
    }

    const updateBounds = () => {
      setMapBoundsGeometry(getMapBoundsGeometry(map));
    };

    updateBounds();
    map.on('moveend', updateBounds);
    map.on('zoomend', updateBounds);

    return () => {
      map.off('moveend', updateBounds);
      map.off('zoomend', updateBounds);
    };
  }, [geometry, map]);

  const effectiveGeometry = useMemo(() => {
    if (geometry) return geometry;
    if (mapBoundsGeometry) return mapBoundsGeometry;
    if (map) return getMapBoundsGeometry(map);
    return null;
  }, [geometry, mapBoundsGeometry, map]);

  useEffect(() => {
    if (effectiveGeometry) {
      onGeometryChange?.(effectiveGeometry);
    }
  }, [effectiveGeometry, onGeometryChange]);

  const model = useMemo(
    () =>
      buildMapTimelineModel({
        markers: markerInputs,
        defaultDate,
        defaultRangeEnd,
        rangeStartOverride,
        rangeEndOverride,
      }),
    [markerInputs, defaultDate, defaultRangeEnd, rangeStartOverride, rangeEndOverride]
  );

  const styleFor = (kind: string): MapTimelineMarkerStyle =>
    markerStyles?.[kind] ?? FALLBACK_MARKER_STYLE;

  // `sliderIndex` tracks the thumb position during drag (visual only).
  // `committedIndex` is what actually drives onMonthChange — updated on release
  // (onValueCommit), so dragging across months doesn't fire a request per step.
  const [sliderIndex, setSliderIndex] = useState(0);
  const [committedIndex, setCommittedIndex] = useState(0);

  useEffect(() => {
    if (!model) return;
    setSliderIndex(model.defaultIndex);
    setCommittedIndex(model.defaultIndex);
  }, [model?.defaultIndex, model?.months.length]);

  useEffect(() => {
    if (!model) return;
    const month = model.months[committedIndex];
    if (month) onMonthChange?.(month);
  }, [model, committedIndex, onMonthChange]);

  // Emit the effective month range (as YYYY-MM-DD strings) so the parent can fetch
  // the data-strip summary. Stable string deps avoid re-emitting on Date identity.
  const rangeStartIso = model ? format(model.rangeStart, 'yyyy-MM-dd') : null;
  const rangeEndIso = model ? format(model.rangeEnd, 'yyyy-MM-dd') : null;
  useEffect(() => {
    if (!rangeStartIso || !rangeEndIso) return;
    onRangeChange?.({ startDate: rangeStartIso, endDate: rangeEndIso });
  }, [rangeStartIso, rangeEndIso, onRangeChange]);

  if (!model || model.months.length === 0) {
    return null;
  }

  const handleToggleDataStrip = () => {
    setDataStripOpen((prev) => {
      const next = !prev;
      onDataStripToggle?.(next);
      return next;
    });
  };

  // Clicking a data-strip cell jumps the slider (and commits, firing onMonthChange).
  const handleSelectMonth = (index: number) => {
    setSliderIndex(index);
    setCommittedIndex(index);
  };

  const selectedMonth = model.months[sliderIndex] ?? model.months[model.defaultIndex];
  const maxIndex = model.months.length - 1;
  const maxMonth = getTimelineMaxMonth();

  // "YYYY-MM" values for the range inputs — prefer user override, fall back to model bounds
  const rangeStartValue = rangeStartOverride ?? format(model.rangeStart, 'yyyy-MM');
  const rangeEndValue = rangeEndOverride ?? format(model.rangeEnd, 'yyyy-MM');

  return (
    <div
      className={cn(
        'pointer-events-auto rounded-lg border border-border/80 bg-background/95 px-4 py-3 shadow-lg backdrop-blur-sm',
        className
      )}
      role="region"
      aria-label="Map timeline"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium tabular-nums">{selectedMonth.label}</p>
          {isLoadingMosaic && (
            <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label="Loading mosaic" />
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer" title="Mosaic visualization mode">
            <Layers className="size-3 text-muted-foreground shrink-0" aria-hidden />
            <select
              value={visualization}
              onChange={(e) => {
                const val = e.target.value as SentinelVisualization;
                setVisualization(val);
                onVisualizationChange?.(val);
              }}
              className="bg-transparent text-[10px] text-muted-foreground border-none outline-none cursor-pointer pr-0.5"
              aria-label="Mosaic visualization"
            >
              {VISUALIZATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 cursor-pointer" title="Maximum cloud cover per image">
            <Cloud className="size-3 text-muted-foreground shrink-0" aria-hidden />
            <select
              value={cloudPct}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCloudPct(val);
                onCloudFilterChange?.(val);
              }}
              className="bg-transparent text-[10px] text-muted-foreground border-none outline-none cursor-pointer pr-0.5 tabular-nums"
              aria-label="Max. cloud cover"
            >
              {CLOUD_OPTIONS.map((pct) => (
                <option key={pct} value={pct}>
                  ≤ {pct}%
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleToggleDataStrip}
            className={cn(
              'map-timeline-data-toggle flex items-center gap-1 text-[10px] transition-colors cursor-pointer',
              dataStripOpen ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
            title="Toggle NDVI / cloud data strip"
            aria-pressed={dataStripOpen}
          >
            <BarChart3 className="size-3 shrink-0" aria-hidden />
            Data
          </button>
        </div>
      </div>

      <div className="relative px-1 pt-5 pb-1">
        <div className="pointer-events-none absolute inset-x-1 top-0 h-5" aria-hidden>
          {model.markers.map((marker) => (
            <div
              key={`${marker.kind}-${marker.index}`}
              className="absolute top-1 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${marker.percent}%` }}
              title={`${styleFor(marker.kind).legend}: ${marker.label}`}
            >
              <span
                className={cn(
                  'size-2.5 rounded-full ring-2',
                  styleFor(marker.kind).dot,
                  styleFor(marker.kind).ring
                )}
              />
            </div>
          ))}
        </div>

        <Slider
          min={0}
          max={maxIndex}
          step={1}
          value={[sliderIndex]}
          onValueChange={(value) => {
            const next = value[0];
            if (typeof next === 'number') setSliderIndex(next);
          }}
          onValueCommit={(value) => {
            const next = value[0];
            if (typeof next === 'number') setCommittedIndex(next);
          }}
          aria-label="Timeline month"
          aria-valuetext={selectedMonth.label}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-center gap-3">
          {model.markers.map((marker) => (
            <span
              key={`${marker.kind}-${marker.index}`}
              className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground"
            >
              <span
                className={cn('size-2 rounded-full', styleFor(marker.kind).dot)}
                aria-hidden
              />
              <span>
                {styleFor(marker.kind).legend}
                <span className="ml-1 tabular-nums text-foreground/80">{marker.label}</span>
              </span>
            </span>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
          <input
            type="month"
            value={rangeStartValue}
            min={TIMELINE_MIN_MONTH}
            max={rangeEndValue > maxMonth ? maxMonth : rangeEndValue}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setRangeStartOverride(null);
                return;
              }
              setRangeStartOverride(
                clampMonthString(val, TIMELINE_MIN_MONTH, rangeEndValue)
              );
            }}
            className="bg-transparent border-none outline-none cursor-pointer w-[6.5rem] text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Range start"
          />
          <span>·</span>
          <input
            type="month"
            value={rangeEndValue}
            min={rangeStartValue}
            max={maxMonth}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) {
                setRangeEndOverride(null);
                return;
              }
              setRangeEndOverride(
                clampMonthString(val, rangeStartValue, maxMonth)
              );
            }}
            className="bg-transparent border-none outline-none cursor-pointer w-[6.5rem] text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Range end"
          />
        </div>
      </div>

      {dataStripOpen && (
        <MapTimelineDataStrip
          months={model.months}
          summary={summary}
          selectedIndex={sliderIndex}
          isLoading={isLoadingSummary}
          onSelectMonth={handleSelectMonth}
        />
      )}
    </div>
  );
}
