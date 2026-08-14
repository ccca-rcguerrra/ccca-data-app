/**
 * Visualization modes for Sentinel-2 mosaics.
 * Used by the mosaic map layer and PNG endpoints. Defaults to NaturalColor when omitted.
 */
export enum SentinelVisualization {
  /** True colour RGB: B4/B3/B2. */
  NaturalColor = 'NATURAL_COLOR',
  /** Colour infrared (false colour): B8/B4/B3 — healthy vegetation appears red. */
  FalseColor = 'FALSE_COLOR',
  /** Normalized Difference Vegetation Index: (B8 - B4) / (B8 + B4). */
  NDVI = 'NDVI',
  /** Short-wave infrared composite: B12/B8A/B4 — vegetation green, soil brown, water black. */
  SWIR = 'SWIR',
  /** Normalized Difference Moisture Index: (B8A - B11) / (B8A + B11). */
  NDMI = 'NDMI',
}
