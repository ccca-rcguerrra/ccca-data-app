/**
 * Filterable property names for COPERNICUS/S2_SR_HARMONIZED (collection-specific keys only).
 * For `system:*` keys shared by all collections, use `GeeCommonImageProperty`.
 *
 * @example
 *   collection.filter(ee.Filter.lt(S2SrHarmonizedImageProperty.CloudyPixelPercentage, 20))
 */
export enum S2SrHarmonizedImageProperty {
  // ── Cloud / scene quality ──────────────────────────────────────────────────
  /** Granule-level cloud %. Preferred for single-granule filtering. */
  CloudyPixelPercentage         = 'CLOUDY_PIXEL_PERCENTAGE',
  /** File-level cloud %. May differ from CloudyPixelPercentage. */
  CloudCoverageAssessment       = 'CLOUD_COVERAGE_ASSESSMENT',
  CloudyPixelOverLandPercentage = 'CLOUDY_PIXEL_OVER_LAND_PERCENTAGE',
  CloudShadowPercentage         = 'CLOUD_SHADOW_PERCENTAGE',
  HighProbaCloudPercentage      = 'HIGH_PROBA_CLOUDS_PERCENTAGE',
  MediumProbaCloudPercentage    = 'MEDIUM_PROBA_CLOUDS_PERCENTAGE',
  ThinCirrusPercentage          = 'THIN_CIRRUS_PERCENTAGE',
  SnowIcePercentage             = 'SNOW_ICE_PERCENTAGE',
  // ── Land cover percentages ─────────────────────────────────────────────────
  VegetationPercentage          = 'VEGETATION_PERCENTAGE',
  NotVegetatedPercentage        = 'NOT_VEGETATED_PERCENTAGE',
  WaterPercentage               = 'WATER_PERCENTAGE',
  NodataPixelPercentage         = 'NODATA_PIXEL_PERCENTAGE',
  UnclassifiedPercentage        = 'UNCLASSIFIED_PERCENTAGE',
  DarkFeaturesPercentage        = 'DARK_FEATURES_PERCENTAGE',
  // ── Orbit / acquisition ────────────────────────────────────────────────────
  SensingOrbitDirection         = 'SENSING_ORBIT_DIRECTION',
  SensingOrbitNumber            = 'SENSING_ORBIT_NUMBER',
  SpacecraftName                = 'SPACECRAFT_NAME',
  MeanSolarAzimuthAngle         = 'MEAN_SOLAR_AZIMUTH_ANGLE',
  MeanSolarZenithAngle          = 'MEAN_SOLAR_ZENITH_ANGLE',
  // ── Product identification ─────────────────────────────────────────────────
  MgrsTitle                     = 'MGRS_TILE',
  ProcessingBaseline            = 'PROCESSING_BASELINE',
}
