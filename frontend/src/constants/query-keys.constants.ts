export const QUERY_KEYS = {
  auth: {
    all: () => ['auth'] as const,
    me: () => ['auth', 'me'] as const,
  },
  alerts: {
    all: () => ['alerts'] as const,
    lists: () => ['alerts', 'list'] as const,
    list: (params: unknown) => ['alerts', 'list', params] as const,
    detail: (id: number) => ['alerts', 'detail', id] as const,
    status: (id: number) => ['alerts', 'status', id] as const,
    geometry: (id: number, order: unknown) => ['alerts', 'geometry', id, order] as const,
    refinement: (id: number) => ['alerts', 'refinement', id] as const,
    activation: (id: number) => ['alerts', 'activation', id] as const,
    activationsBatch: (key: string) => ['alerts', 'activation', 'batch', key] as const,
    territories: (id: number) => ['alerts', 'territories', id] as const,
    sources: () => ['alerts', 'sources'] as const,
    images: (id: number) => ['alerts', 'images', id] as const,
    ruralProperties: (id: number) => ['alerts', 'ruralproperties', id] as const,
    ruralPropertiesBatch: (key: string) => ['alerts', 'ruralproperties', 'batch', key] as const,
    pngUrlsAll: () => ['alerts', 'png-urls'] as const,
    pngUrls: (id: number) => ['alerts', 'png-urls', id] as const,
    pngUrlsBatch: (key: string) => ['alerts', 'png-urls', 'batch', key] as const,
    neighbors: (id: number, geometry: unknown) => ['alerts', 'neighbors', id, geometry] as const,
    viewers: (id: number) => ['alerts', 'viewers', id] as const,
  },
  comments: {
    all: () => ['comments'] as const,
    lists: () => ['comments', 'list'] as const,
    list: (channel: string) => ['comments', 'list', channel] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
    lists: () => ['notifications', 'list'] as const,
    list: (params: unknown) => ['notifications', 'list', params] as const,
    unreadCount: () => ['notifications', 'unread-count'] as const,
  },
  supports: {
    all: () => ['supports'] as const,
    lists: () => ['supports', 'list'] as const,
    list: (params: unknown) => ['supports', 'list', params] as const,
    detail: (id: number) => ['supports', 'detail', id] as const,
  },
  users: {
    all: () => ['users'] as const,
    lists: () => ['users', 'list'] as const,
    list: (params: unknown) => ['users', 'list', params] as const,
    search: (params: unknown) => ['users', 'search', params] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
    online: () => ['users', 'online'] as const,
  },
  teams: {
    all: () => ['teams'] as const,
    lists: () => ['teams', 'list'] as const,
    list: (params: unknown) => ['teams', 'list', params] as const,
    detail: (id: number) => ['teams', 'detail', id] as const,
  },
  activations: {
    all: () => ['activations'] as const,
    lists: () => ['activations', 'list'] as const,
    list: (params: unknown) => ['activations', 'list', params] as const,
    detail: (id: number) => ['activations', 'detail', id] as const,
    geeMapLayer: (id: number, visualization?: string) =>
      ['activations', 'gee-map-layer', id, visualization ?? 'NATURAL_COLOR'] as const,
  },
  images: {
    all: () => ['images'] as const,
    lists: () => ['images', 'list'] as const,
    list: (params: unknown) => ['images', 'list', params] as const,
    detail: (id: number) => ['images', 'detail', id] as const,
  },
  gee: {
    all: () => ['gee'] as const,
    status: () => ['gee', 'status'] as const,
    sentinelFeatures: (params: unknown) => ['gee', 'sentinel', 'features', params] as const,
    sentinelMosaicMapLayer: (params: unknown) => ['gee', 'sentinel', 'mosaic', 'maplayer', params] as const,
    sentinelMosaicPng: (params: unknown) => ['gee', 'sentinel', 'mosaic', 'png', params] as const,
    sentinelTimeSeries: (params: unknown) => ['gee', 'sentinel', 'timeseries', 'indexes', params] as const,
    sentinelTimelineSummary: (params: unknown) => ['gee', 'sentinel', 'timeline', 'summary', params] as const,
  },
  statistics: {
    all: () => ['statistics'] as const,
    analyzed: (params: unknown) => ['statistics', 'analyzed', params] as const,
    notAnalyzed: (params: unknown) => ['statistics', 'not-analyzed', params] as const,
    analyzedByUser: (params: unknown) => ['statistics', 'analyzed-by-user', params] as const,
    operationSummary: (params: unknown) => ['statistics', 'operation', 'summary', params] as const,
    operationByUser: (params: unknown) => ['statistics', 'operation', 'by-user', params] as const,
    operationStatusEventsByDay: (params: unknown) => ['statistics', 'operation', 'status-events-by-day', params] as const,
    generalTeamStatus: (params: unknown) => ['statistics', 'general', 'team-status', params] as const,
    generalTeamProcessedByMonth: (params: unknown) => ['statistics', 'general', 'team-processed-by-month', params] as const,
    generalRawAlertsByMonth: (params: unknown) => ['statistics', 'general', 'raw-alerts-by-month', params] as const,
  },
  territories: {
    all: () => ['territories'] as const,
    lists: () => ['territories', 'list'] as const,
    list: (params: unknown) => ['territories', 'list', params] as const,
    detail: (id: number) => ['territories', 'detail', id] as const,
    bbox: (id: number) => ['territories', 'bbox', id] as const,
  },
  working: {
    all: () => ['working'] as const,
    myAssignments: () => ['working', 'my-assignments'] as const,
    list: (params: unknown) => ['working', 'list', params] as const,
  },
  appConfig: {
    all: () => ['app-config'] as const,
    get: () => ['app-config', 'get'] as const,
    publicMetadata: () => ['app-config', 'public-metadata'] as const,
  },
  semaspa: {
    all: () => ['semaspa'] as const,
    autefs: {
      lists: () => ['semaspa', 'autefs', 'list'] as const,
      list: (params: unknown) => ['semaspa', 'autefs', 'list', params] as const,
      detail: (id: number) => ['semaspa', 'autefs', 'detail', id] as const,
      species: (id: number, params: unknown) =>
        ['semaspa', 'autefs', 'species', id, params] as const,
      volumeBalances: (id: number, params: unknown) =>
        ['semaspa', 'autefs', 'volume-balances', id, params] as const,
      forestGuides: (id: number, params: unknown) =>
        ['semaspa', 'autefs', 'forest-guides', id, params] as const,
      harvestUnits: (id: number, params: unknown) =>
        ['semaspa', 'autefs', 'harvest-units', id, params] as const,
      roles: (id: number, params: unknown) =>
        ['semaspa', 'autefs', 'roles', id, params] as const,
    },
    people: {
      detail: (id: string) => ['semaspa', 'people', 'detail', id] as const,
    },
    speciesProducts: {
      detail: (id: string) => ['semaspa', 'species-products', 'detail', id] as const,
    },
    forestGuides: {
      lists: () => ['semaspa', 'forest-guides', 'list'] as const,
      list: (params: unknown) => ['semaspa', 'forest-guides', 'list', params] as const,
      detail: (id: number) => ['semaspa', 'forest-guides', 'detail', id] as const,
      species: (id: number, params: unknown) =>
        ['semaspa', 'forest-guides', 'species', id, params] as const,
      roles: (id: number, params: unknown) =>
        ['semaspa', 'forest-guides', 'roles', id, params] as const,
      autefs: (id: number, params: unknown) =>
        ['semaspa', 'forest-guides', 'autefs', id, params] as const,
    },
  },
} as const;
