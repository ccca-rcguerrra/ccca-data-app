export const REDIS_TTL = {
  AUTH_USER: 300, // 5 minutes
  RESET_TOKEN: 60 * 60, // 1 hour
  SCCON_AUTH: 60 * 60 * 3, // 3 hours
  SUPPORTS_AUTH: 60 * 20, // 20 minutes
  GEE_MAP_LAYER: 60 * 60 * 12, // 12 hours — GEE tile endpoints stay valid for long
  GEE_PNG: 60 * 60 * 12, // 12 hours
  GEE_FEATURES: 60 * 60 * 24, // 24 hours — Sentinel-2 catalogue changes slowly
  GEE_TIMELINE_SUMMARY: 60 * 60 * 24, // 24 hours — per-period NDVI/cloud aggregates change slowly
} as const;
