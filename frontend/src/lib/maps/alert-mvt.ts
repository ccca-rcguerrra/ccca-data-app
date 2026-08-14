import { APP_CONFIG } from '@/constants/config';

export const ALERTS_MVT_BASE_URL = `${APP_CONFIG.API_BASE_URL}/api/alerts/mvt/{z}/{x}/{y}`;
export const ALERTS_MVT_SOURCE_LAYER = 'alerts';

/** Below this zoom the backend is not queried because tile volume is excessive. */
export const ALERTS_MVT_MIN_ZOOM = 8;

/** Published alerts are a system layer, not initiative-specific configuration. */
export const PUBLISHED_ALERTS_MVT_URL = `${ALERTS_MVT_BASE_URL}?status=published`;
export const PUBLISHED_ALERTS_LINE_COLOR = '#ff0000';
export const PUBLISHED_ALERTS_LINE_WIDTH: unknown[] = [
  'step',
  ['zoom'],
  3,
  14,
  1,
];
