import { useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineSummaryPoint } from '@/types/gee';
import type { MapTimelineMonth } from '@/utils/map-timeline';

/**
 * Data heatmap rendered under the timeline slider: one row for NDVI and one for
 * cloud cover, with one cell per month aligned to the slider track. Reads at a
 * glance which month is both clear (low cloud) and change-bearing (NDVI drop),
 * so analysts can jump straight to the right month.
 */
export interface MapTimelineDataStripProps {
  /** Months of the slider model — the strip aligns one cell per month. */
  months: MapTimelineMonth[];
  /** Per-period summary points (keyed internally by YYYY-MM). */
  summary: TimelineSummaryPoint[] | null | undefined;
  /** Index of the month currently selected on the slider (highlighted cell). */
  selectedIndex: number;
  /** Spinner while the summary is being fetched. */
  isLoading?: boolean;
  /** Click a cell to jump the slider to that month. */
  onSelectMonth?: (index: number) => void;
}

/** Linear-interpolated colour scale over an evenly-spaced list of hex stops. */
function colorScale(value: number, [min, max]: [number, number], colors: string[]): string {
  const clamped = Math.max(min, Math.min(max, value));
  const t = max === min ? 0 : (clamped - min) / (max - min);
  const scaled = t * (colors.length - 1);
  const i = Math.floor(scaled);
  const f = scaled - i;
  const c0 = hexToRgb(colors[i]);
  const c1 = hexToRgb(colors[Math.min(i + 1, colors.length - 1)]);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * f);
  return `rgb(${mix(c0[0], c1[0])}, ${mix(c0[1], c1[1])}, ${mix(c0[2], c1[2])})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// NDVI: low vegetation (brown) → high vegetation (green). Domain clamped to a
// useful land range so bare soil vs. forest reads clearly.
const NDVI_COLORS = ['#8c510a', '#d8b365', '#f6e8c3', '#91cf60', '#1a9850'];
const NDVI_DOMAIN: [number, number] = [0, 0.85];

// Cloud: clear (green) → fully clouded (red).
const CLOUD_COLORS = ['#1a9850', '#a6d96a', '#fee08b', '#fc8d59', '#d73027'];
const CLOUD_DOMAIN: [number, number] = [0, 100];

// Diagonal hatch for "no image in this month" — distinct from a coloured value.
const NO_DATA_STYLE: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(120, 120, 120, 0.3) 0 2px, transparent 2px 5px)',
};

interface CellGeometry {
  centerPct: number;
  widthPct: number;
}

export function MapTimelineDataStrip({
  months,
  summary,
  selectedIndex,
  isLoading = false,
  onSelectMonth,
}: MapTimelineDataStripProps) {
  // Index summary points by YYYY-MM for O(1) per-month lookup.
  const byMonth = useMemo(() => {
    const map = new Map<string, TimelineSummaryPoint>();
    for (const point of summary ?? []) {
      // point.date is the period start (YYYY-MM-DD); key by month.
      map.set(point.date.slice(0, 7), point);
    }
    return map;
  }, [summary]);

  // Cell centres match the slider/marker percent mapping: index/(N-1).
  const cell = (index: number): CellGeometry => {
    const n = months.length;
    if (n <= 1) return { centerPct: 50, widthPct: 100 };
    return { centerPct: (index / (n - 1)) * 100, widthPct: 100 / (n - 1) };
  };

  const renderRow = (label: string, kind: 'ndvi' | 'cloud') => (
    <div className="relative h-3.5 w-full overflow-hidden rounded-sm bg-muted/30">
      <span className="pointer-events-none absolute left-0 top-0 z-10 flex h-full items-center rounded-sm bg-background/70 px-1 text-[8px] leading-none text-muted-foreground">
        {label}
      </span>
      {months.map((month) => {
        const key = format(month.date, 'yyyy-MM');
        const point = byMonth.get(key);
        const value = kind === 'ndvi' ? point?.ndvi : point?.cloud;
        const hasValue = value !== null && value !== undefined;
        const { centerPct, widthPct } = cell(month.index);

        const background = hasValue
          ? kind === 'ndvi'
            ? colorScale(value, NDVI_DOMAIN, NDVI_COLORS)
            : colorScale(value, CLOUD_DOMAIN, CLOUD_COLORS)
          : undefined;

        const ndviText = point?.ndvi != null ? point.ndvi.toFixed(2) : '—';
        const cloudText = point?.cloud != null ? `${Math.round(point.cloud)}%` : '—';
        const count = point?.count ?? 0;

        return (
          <button
            key={`${kind}-${month.index}`}
            type="button"
            onClick={() => onSelectMonth?.(month.index)}
            title={`${month.label} · NDVI ${ndviText} · Cloud ${cloudText} · ${count} img`}
            aria-label={`${month.label}: NDVI ${ndviText}, cloud ${cloudText}, ${count} images`}
            className={cn(
              'absolute top-0 h-full -translate-x-1/2 cursor-pointer border-0 p-0 transition-[outline] hover:z-20 hover:outline hover:outline-1 hover:outline-foreground/60',
              month.index === selectedIndex && 'z-20 outline outline-1 outline-foreground'
            )}
            style={{
              left: `${centerPct}%`,
              width: `${widthPct}%`,
              ...(hasValue ? { backgroundColor: background } : NO_DATA_STYLE),
            }}
          />
        );
      })}
    </div>
  );

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">Data</span>
        {isLoading && (
          <Loader2 className="size-3 animate-spin text-muted-foreground" aria-label="Loading data" />
        )}
      </div>
      {renderRow('NDVI', 'ndvi')}
      {renderRow('Cloud', 'cloud')}
    </div>
  );
}
