/**
 * Calendar date from the API (`YYYY-MM-DD`).
 * Represents a civil day, not an instant in time.
 *
 * @see {@link parseISODateLocal} and {@link formatISODateLocal} in `@/utils/date`
 */
export type ISODate = string;

/**
 * ISO-8601 instant from the API (includes time and usually timezone).
 * Safe to parse with `new Date()` when you need an absolute moment.
 */
export type ISODateTime = string;
