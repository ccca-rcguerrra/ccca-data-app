export const MAP_CONFIG = {
  DEFAULT_CENTER: [0, 0] as [number, number],
  DEFAULT_ZOOM: 2,
  DEFAULT_STYLE:
    'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
} as const;

export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 260,
  HEADER_HEIGHT: 64,
  ANIMATION_DURATION: 300,
} as const;

export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  API: 'yyyy-MM-dd',
  DATETIME: 'dd/MM/yyyy HH:mm',
} as const;

export {
  STORAGE_KEYS,
  STORAGE_KEY_PREFIXES,
  storageKey,
} from './storage.constants';

export { ROUTES, toChildPath } from './routes.constants';
