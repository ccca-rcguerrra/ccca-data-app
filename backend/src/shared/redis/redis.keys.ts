export const REDIS_KEYS = {
  auth: {
    user: (userId: number) => `auth:user:${userId}`,
    resetToken: (token: string) => `auth:reset:${token}`,
  },
  sccon: {
    auth: 'sccon:auth',
  },
  supports: {
    auth: 'supports:auth',
  },
  online: {
    /** Per-user socket IDs — supports multiple tabs */
    userConnections: (userId: number) => `online:connections:${userId}`,
  },
  gee: {
    /** Sentinel-2 mosaic map layer (mapid/token/urlFormat) by params hash */
    sentinelMapLayer: (hash: string) => `gee:s2:maplayer:${hash}`,
    /** Sentinel-2 mosaic PNG thumbnail URL by params hash */
    sentinelPng: (hash: string) => `gee:s2:png:${hash}`,
    /** Sentinel-2 image FeatureCollection by params hash */
    sentinelFeatures: (hash: string) => `gee:s2:features:${hash}`,
    /** Sentinel-2 timeline summary (NDVI + mean cloud + count per period) by params hash */
    sentinelTimelineSummary: (hash: string) => `gee:s2:timeline-summary:${hash}`,
  },
} as const;
