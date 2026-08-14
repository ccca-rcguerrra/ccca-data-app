import ee = require('@google/earthengine');

export interface MapLayerData {
  mapid: string;
  token: string;
  urlFormat: string;
}

/**
 * Common contract for GEE image provider services.
 * Both PlanetScope and Sentinel-2 can produce a map layer from a pre-built mosaic.
 * buildMosaic() is also expected by convention but its signature varies per provider.
 */
export interface IGeeImageProvider {
  getMapLayer(mosaic: ee.Image): Promise<MapLayerData>;
}
