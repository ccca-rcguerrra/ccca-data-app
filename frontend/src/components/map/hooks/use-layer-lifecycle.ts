import { useCallback, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface UseLayerLifecycleOptions {
  sourceId: string;
  layerId: string;
  map: MapLibreMap | null;
  isMapLoaded: boolean;
  createLayer: (targetMap: MapLibreMap) => boolean;
  destroyLayer: (targetMap: MapLibreMap) => boolean;
}

export interface UseLayerLifecycleReturn {
  isDestroyedRef: React.MutableRefObject<boolean>;
  create: () => void;
  destroy: () => void;
  isDestroyed: () => boolean;
}

/**
 * Custom hook to manage layer lifecycle (create/destroy)
 * @param options - Configuration options for lifecycle management
 * @returns Refs and functions for lifecycle management
 */
export const useLayerLifecycle = (
  options: UseLayerLifecycleOptions,
): UseLayerLifecycleReturn => {
  const { sourceId, layerId, map, isMapLoaded, createLayer, destroyLayer } = options;
  const isDestroyedRef = useRef<boolean>(false);

  const create = useCallback(() => {
    if (!map || !isMapLoaded) return;
    isDestroyedRef.current = false; // Reset destroyed flag
    createLayer(map);
  }, [map, isMapLoaded, createLayer]);

  const destroy = useCallback(() => {
    if (!map || !isMapLoaded) return;
    destroyLayer(map);
    isDestroyedRef.current = true; // Mark as destroyed
  }, [map, isMapLoaded, destroyLayer]);

  const isDestroyed = useCallback(() => {
    return isDestroyedRef.current;
  }, []);

  return {
    isDestroyedRef,
    create,
    destroy,
    isDestroyed,
  };
};

