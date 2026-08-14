import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Builds a GeoJSON polygon from the current visible map viewport bounds.
 */
export function getMapBoundsGeometry(map: MapLibreMap): GeoJSON.Polygon {
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return {
    type: 'Polygon',
    coordinates: [
      [
        [sw.lng, sw.lat],
        [ne.lng, sw.lat],
        [ne.lng, ne.lat],
        [sw.lng, ne.lat],
        [sw.lng, sw.lat],
      ],
    ],
  };
}
