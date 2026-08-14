import { buffer, feature, featureCollection } from '@turf/turf';
import { combinePolygonFeatureCollection, squareBuffer } from '@/utils/geojson';

/**
 * Normalises a drawn activation geometry to its square bounding box.
 * Applied on draw-stop and onChange so the map always shows a square footprint.
 */
export function applyActivationGeometryPostProcess(
  geometries: GeoJSON.FeatureCollection
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  const merged = combinePolygonFeatureCollection(geometries);
  if (!merged) return geometries as GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  return featureCollection([feature(squareBuffer(merged, 0))]);
}

/**
 * Computes the minimum required activation geometry extent:
 * square bounding box of the reference geometry expanded by 500 m.
 * Returns a FeatureCollection to be shown as a guide on the map while drawing.
 */
export function buildActivationGeometryGuide(
  referenceFc: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null | undefined
): GeoJSON.FeatureCollection<GeoJSON.Geometry> | null {
  if (!referenceFc?.features?.length) return null;
  try {
    const geom = combinePolygonFeatureCollection(referenceFc);
    if (!geom) return null;
    const bbox = squareBuffer(geom, 0);
    const expanded = buffer(feature(bbox), 500, { units: 'meters' });
    if (!expanded) return null;
    return featureCollection([expanded]);
  } catch {
    return null;
  }
}

/**
 * Generates an activation geometry from a reference geometry:
 * square bounding box expanded by `bufferKm` kilometres (default 0.5 km = 500 m).
 * Returns null when the reference geometry is absent or the computation fails.
 */
export function generateActivationGeometry(
  referenceFc: GeoJSON.FeatureCollection<GeoJSON.Geometry> | null | undefined,
  bufferKm = 0.5
): GeoJSON.Polygon | null {
  if (!referenceFc?.features?.length) return null;
  try {
    const geom = combinePolygonFeatureCollection(referenceFc);
    if (!geom) return null;
    return squareBuffer(geom, bufferKm);
  } catch {
    return null;
  }
}
