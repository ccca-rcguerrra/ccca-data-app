import { addDays, format, isValid, parseISO } from 'date-fns';
import type { ISODate } from '@/types/dates';

/** Default placeholder when a date value is missing in the UI. */
export const EMPTY_DATE_LABEL = '—';

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns true when `value` is a calendar date string (`YYYY-MM-DD`).
 */
export function isISODateOnly(value: string): value is ISODate {
  return ISO_DATE_ONLY.test(value.trim());
}

/**
 * Parses an ISO calendar date or date-time string for local use.
 *
 * - **Date-only (`YYYY-MM-DD`)**: parsed as a local calendar date via `parseISO`.
 *   Do not use `new Date(value)` — ECMAScript treats it as UTC midnight and may
 *   shift the displayed day in negative-offset timezones.
 * - **Full ISO datetimes**: parsed as instants (same as `parseISO`).
 */
export function parseISODateLocal(value: string | null | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = parseISO(trimmed);
  return isValid(parsed) ? parsed : null;
}

/**
 * Formats an ISO calendar date or date-time for UI display (date part only).
 *
 * @example
 * formatISODateLocal(alert.detectedAt)
 * formatISODateLocal(alert.detectedAt, 'pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
 */
export function formatISODateLocal(
  value: string | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
  emptyLabel: string = EMPTY_DATE_LABEL
): string {
  const date = parseISODateLocal(value);
  if (!date) return emptyLabel;
  return date.toLocaleDateString(locale, options);
}

/**
 * Formats an ISO date-time instant for UI display (date and time).
 * Use for fields such as `insertedAt` or `acquiredAt`.
 */
export function formatISODateTime(
  value: string | null | undefined,
  locale?: string,
  options?: Intl.DateTimeFormatOptions,
  emptyLabel: string = EMPTY_DATE_LABEL
): string {
  const trimmed = value?.trim();
  if (!trimmed) return emptyLabel;
  const parsed = parseISO(trimmed);
  if (!isValid(parsed)) return emptyLabel;
  return parsed.toLocaleString(locale, options);
}

/**
 * Serializes a `Date` to `YYYY-MM-DD` for API query params and filter state.
 */
export function toISODateString(date: Date): ISODate {
  return format(date, 'yyyy-MM-dd') as ISODate;
}

/**
 * Converts a `Date` from a calendar control to `ISODate`, or returns `null` when invalid.
 */
export function dateToISODate(date: Date | null | undefined): ISODate | null {
  if (!date || !isValid(date)) return null;
  return toISODateString(date);
}

/**
 * Shifts a calendar date by `days`, staying in calendar space.
 *
 * Parses and formats locally (both ends), so the result is the same day in every
 * timezone — unlike `new Date('YYYY-MM-DD')`, which anchors to UTC midnight and
 * rolls back a day in negative-offset zones.
 *
 * @example
 * addDaysToISODate('2025-12-30', 1) // '2025-12-31'
 */
export function addDaysToISODate(value: ISODate, days: number): ISODate {
  const parsed = parseISODateLocal(value);
  if (!parsed) return value;
  return toISODateString(addDays(parsed, days));
}
