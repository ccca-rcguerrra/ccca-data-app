/**
 * Filterable property names for projects/nexgenmap/MapBiomas2/PLANET/images (collection-specific keys only).
 * For `system:*` keys shared by all collections, use `GeeCommonImageProperty`.
 *
 * @example
 *   collection.filter(ee.Filter.lt(PlanetMapbiomasImageProperty.CloudCoverPercentage, 5))
 */
export enum PlanetMapbiomasImageProperty {
  // ── Cloud / quality ────────────────────────────────────────────────────────
  CloudCoverPercentage    = 'cloud_cover_percentage',
  UnusableDataPercentage  = 'unusable_data_percentage',
  // ── Acquisition geometry ───────────────────────────────────────────────────
  AzimuthAngle            = 'azimuth_angle',
  IlluminationAzimuthAngle = 'illumination_azimuth_angle',
  IlluminationElevationAngle = 'illumination_elevation_angle',
  IncidenceAngle          = 'incidence_angle',
  SpaceCraftViewAngle     = 'space_craft_view_angle',
  OrbitDirection          = 'orbit_direction',
  // ── Platform / sensor ─────────────────────────────────────────────────────
  PlatformShortName       = 'platform_short_name',
  PlatformSerialIdentifier = 'platform_serial_identifier',
  PlatformOrbitType       = 'platform_orbit_type',
  InstrumentShortName     = 'instrument_short_name',
  SensorType              = 'sensor_type',
  ScanType                = 'scan_type',
  // ── Product ───────────────────────────────────────────────────────────────
  ProductType             = 'product_type',
  AcquisitionType         = 'acquisition_type',
  Resolution              = 'resolution',
  Tile                    = 'tile',
}
