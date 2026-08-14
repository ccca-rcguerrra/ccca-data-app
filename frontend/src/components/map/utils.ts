import { bbox, feature, featureCollection } from '@turf/turf';
import type { GeoJSONLike } from './types';
import type { Map as MapLibreMap, RequestParameters, ResourceType } from 'maplibre-gl';
import { useAuthStore } from '@/stores';
import { APP_CONFIG } from '@/constants/config';

const isFeatureCollection = (
  input: GeoJSONLike,
): input is GeoJSON.FeatureCollection<GeoJSON.Geometry> => {
  return typeof input === 'object' && input !== null && 'type' in input && input.type === 'FeatureCollection';
};

const isFeature = (input: GeoJSONLike): input is GeoJSON.Feature<GeoJSON.Geometry> => {
  return typeof input === 'object' && input !== null && 'type' in input && input.type === 'Feature';
};

export const normalizeGeoJSON = (input: GeoJSONLike): GeoJSON.FeatureCollection<GeoJSON.Geometry> => {
  if (isFeatureCollection(input)) {
    return input;
  }

  if (isFeature(input)) {
    return featureCollection([input]);
  }

  return featureCollection([feature(input, {})]);
};

export const getFeatureBounds = (
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>,
): [number, number, number, number] | null => {
  if (!collection.features.length) {
    return null;
  }

  const bounds = bbox(collection);
  const isValid = bounds.every((value) => Number.isFinite(value));

  return isValid ? (bounds as [number, number, number, number]) : null;
};

/**
 * Find the correct beforeId for layer insertion based on zIndex
 * @param map - MapLibre map instance
 * @param layerId - ID of the layer being inserted (or array of IDs to exclude)
 * @param zIndex - Z-index value for the layer
 * @param beforeId - Explicit beforeId from props (optional)
 * @returns Layer ID to insert before, or undefined to add at the end
 */
export const findBeforeIdByZIndex = (
  map: MapLibreMap | null,
  layerId: string | string[],
  zIndex: number | undefined,
  beforeId?: string,
): string | undefined => {
  if (!map || zIndex === undefined) return beforeId;

  // Get all layers from the map style
  const style = map.getStyle();
  if (!style || !style.layers) return beforeId;

  // Normalize layerId to array for easier comparison
  const excludedLayerIds = Array.isArray(layerId) ? layerId : [layerId];

  // Collect all layers with their zIndex
  const layersWithZIndex: Array<{ id: string; zIndex: number }> = [];
  
  for (const layer of style.layers) {
    if (!layer || excludedLayerIds.includes(layer.id)) continue;
    
    const layerZIndex = (layer as any).metadata?.zIndex;
    if (layerZIndex !== undefined) {
      layersWithZIndex.push({ id: layer.id, zIndex: layerZIndex });
    }
  }

  // Sort by zIndex (ascending - lower zIndex first)
  layersWithZIndex.sort((a, b) => a.zIndex - b.zIndex);

  // Find the first layer with zIndex higher than this one
  const nextLayer = layersWithZIndex.find(l => l.zIndex > zIndex);
  
  if (nextLayer) {
    return nextLayer.id;
  }

  // If no layer with higher zIndex, return undefined to add at the end
  return beforeId;
};

/**
 * Get the insert beforeId for a layer, considering zIndex and explicit beforeId
 * @param map - MapLibre map instance
 * @param layerId - ID of the layer being inserted
 * @param zIndex - Z-index value for the layer
 * @param beforeId - Explicit beforeId from props (optional)
 * @returns Layer ID to insert before, or undefined to add at the end
 */
export const getInsertBeforeId = (
  map: MapLibreMap | null,
  layerId: string,
  zIndex: number | undefined,
  beforeId?: string,
): string | undefined => {
  let insertBeforeId: string | undefined = beforeId;
  
  if (zIndex !== undefined) {
    // Use zIndex to find the correct position
    insertBeforeId = findBeforeIdByZIndex(map, layerId, zIndex, beforeId);
  }
  
  // Validate that the beforeId layer exists
  if (insertBeforeId && map && !map.getLayer(insertBeforeId)) {
    console.warn(`Layer "${insertBeforeId}" does not exist yet, adding layer without beforeId`);
    insertBeforeId = undefined;
  }
  
  return insertBeforeId;
};

/**
 * Runs mutations that rely on Map#getLayer / removeLayer / getSource / removeSource.
 * Swallows errors when the map is already removed or the style object is gone (child unmount vs map.remove() order).
 */
export const safeMapLayersMutation = (
  map: MapLibreMap | null | undefined,
  fn: (m: MapLibreMap) => void,
): void => {
  if (!map) return;
  try {
    fn(map);
  } catch {
    // No-op: teardown race or already-removed style
  }
};

/**
 * Build a MapLibre `transformRequest` function that attaches the JWT bearer
 * token to requests targeting our API (e.g. authenticated MVT tile endpoints).
 *
 * Requests to external tile providers (OSM, Google, WMS, etc.) are left
 * untouched so they keep working without credentials.
 *
 * @returns A `transformRequest` function for the MapLibre map options.
 */
export const createApiAuthTransformRequest = () => {
  return (url: string, _resourceType?: ResourceType): RequestParameters => {
    if (url.startsWith(APP_CONFIG.API_BASE_URL)) {
      const token = useAuthStore.getState().tokens?.accessToken;
      if (token) {
        return { url, headers: { Authorization: `Bearer ${token}` } };
      }
    }
    return { url };
  };
};

