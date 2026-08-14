import {
  eachMonthOfInterval,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfMonth,
} from 'date-fns';

/** Alert-specific marker kinds. The generic timeline accepts any string kind. */
export type MapTimelineMarkerKind = 'detection' | 'before' | 'after';

export interface MapTimelineMonth {
  /** Index in the slider (0-based) */
  index: number;
  date: Date;
  /** Display label, e.g. "Jan 2024" */
  label: string;
}

export interface MapTimelineMarker {
  /** Free-form kind — the caller maps it to a style/legend. */
  kind: string;
  date: Date;
  label: string;
  /** Slider index for this marker's month */
  index: number;
  /** Position on track as percentage (0–100) */
  percent: number;
}

/** Marker input accepted by {@link buildMapTimelineModel}. Dates with no value are dropped. */
export interface MapTimelineMarkerInput {
  kind: string;
  date: string | Date | null | undefined;
  /** Optional custom label; defaults to the formatted month. */
  label?: string;
}

export interface MapTimelineModel {
  months: MapTimelineMonth[];
  markers: MapTimelineMarker[];
  defaultIndex: number;
  rangeStart: Date;
  rangeEnd: Date;
}

const MONTH_LABEL_FORMAT = 'MMM yyyy';
export const TIMELINE_MIN_START = startOfMonth(new Date(2016, 0, 1));
export const TIMELINE_MIN_MONTH = '2016-01';

function getTimelineMaxEnd(): Date {
  return endOfMonth(new Date());
}

export function getTimelineMaxMonth(): string {
  return format(getTimelineMaxEnd(), 'yyyy-MM');
}

export function clampMonthString(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function parseTimelineDate(value: string | null | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

function toTimelineDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  return parseTimelineDate(value);
}

function monthIndexForDate(months: MapTimelineMonth[], date: Date): number {
  const target = startOfMonth(date).getTime();
  const found = months.findIndex((m) => m.date.getTime() === target);
  if (found >= 0) return found;
  const before = months.filter((m) => m.date.getTime() <= target);
  if (before.length === 0) return 0;
  return before[before.length - 1].index;
}

function percentForIndex(index: number, total: number): number {
  if (total <= 1) return 50;
  return (index / (total - 1)) * 100;
}

/**
 * Builds a month/year timeline model for the map timeline slider.
 *
 * Generic by design: the range defaults to Jan 2016 → current month, and any
 * number of markers (with arbitrary `kind`s) can be placed on the track. Both
 * range ends are clamped to [Jan 2016, current month]. Returns `null` only when
 * the resulting range is empty.
 *
 * - `defaultRangeEnd` overrides the (uncapped) default range end — e.g. alerts
 *   use "one year after the after image" so the timeline extends past detection.
 * - `defaultDate` sets which month the slider starts on (else the last month).
 */
export function buildMapTimelineModel(input: {
  /** Markers to place on the track. Entries with no resolvable date are dropped. */
  markers?: MapTimelineMarkerInput[];
  /** Month the slider starts on. Falls back to the last month when omitted. */
  defaultDate?: string | Date | null;
  /** Default (pre-override) range end. Falls back to the current month. */
  defaultRangeEnd?: string | Date | null;
  /** User-overridden range start in "YYYY-MM" format. Cannot be earlier than Jan 2016. */
  rangeStartOverride?: string | null;
  /** User-overridden range end in "YYYY-MM" format. Cannot be later than the current month. */
  rangeEndOverride?: string | null;
}): MapTimelineModel | null {
  const maxEnd = getTimelineMaxEnd();
  const defaultEnd = toTimelineDate(input.defaultRangeEnd);

  let rangeEnd = input.rangeEndOverride
    ? endOfMonth(parseISO(`${input.rangeEndOverride}-01`))
    : defaultEnd
      ? endOfMonth(defaultEnd)
      : maxEnd;
  if (rangeEnd.getTime() > maxEnd.getTime()) {
    rangeEnd = maxEnd;
  }

  let rangeStart = input.rangeStartOverride
    ? startOfMonth(parseISO(`${input.rangeStartOverride}-01`))
    : TIMELINE_MIN_START;
  if (rangeStart.getTime() < TIMELINE_MIN_START.getTime()) {
    rangeStart = TIMELINE_MIN_START;
  }
  if (rangeStart.getTime() > rangeEnd.getTime()) {
    rangeStart = startOfMonth(rangeEnd);
  }

  if (rangeStart.getTime() > rangeEnd.getTime()) return null;

  const monthDates = eachMonthOfInterval({ start: rangeStart, end: rangeEnd });
  if (monthDates.length === 0) return null;

  const months: MapTimelineMonth[] = monthDates.map((date, index) => ({
    index,
    date,
    label: format(date, MONTH_LABEL_FORMAT),
  }));

  const markers: MapTimelineMarker[] = [];
  for (const markerInput of input.markers ?? []) {
    const date = toTimelineDate(markerInput.date);
    if (!date) continue;
    const index = monthIndexForDate(months, date);
    markers.push({
      kind: markerInput.kind,
      date,
      label: markerInput.label ?? format(date, MONTH_LABEL_FORMAT),
      index,
      percent: percentForIndex(index, months.length),
    });
  }

  const anchor = toTimelineDate(input.defaultDate);
  const defaultIndex = anchor ? monthIndexForDate(months, anchor) : months.length - 1;

  return {
    months,
    markers,
    defaultIndex,
    rangeStart,
    rangeEnd,
  };
}
