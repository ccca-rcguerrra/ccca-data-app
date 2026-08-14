/**
 * localStorage is scoped by origin (protocol + host + port), so any other app served
 * from the same origin — a different build of this project on the same dev port, for
 * instance — shares the same storage and can overwrite generic keys such as
 * `auth-store`. Every key written by this app is prefixed to keep it isolated.
 */
const STORAGE_NAMESPACE = 'ccca-data-ws';

/** Builds a key scoped to this application. */
export const storageKey = (name: string): string => `${STORAGE_NAMESPACE}:${name}`;

/** Keys used by the Zustand persist middleware. */
export const STORAGE_KEYS = {
  AUTH: storageKey('auth-store'),
  SETTINGS: storageKey('settings-store'),
  ALERTS_MANAGEMENT: storageKey('alerts-management-store'),
  ALERTS_AUDIT: storageKey('alerts-audit-store'),
  DASHBOARD_OPERATION_FILTERS: storageKey('dashboard-operation-filters-store'),
  ALERT_REFINE_WORK: storageKey('alert-refine-work'),
} as const;

/** Prefixes for cache entries written outside the persist middleware. */
export const STORAGE_KEY_PREFIXES = {
  GEE_TIMESERIES: storageKey('gee-timeseries:'),
  GEE_TIMELINE_SUMMARY: storageKey('gee-timeline-summary:'),
} as const;
