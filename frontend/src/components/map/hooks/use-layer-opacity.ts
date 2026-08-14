import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

export interface UseLayerOpacityOptions {
  initialOpacity: number;
  layerId: string;
  map: MapLibreMap | null;
  isMapLoaded: boolean;
  opacityProperty?: 'raster-opacity' | 'fill-opacity' | 'line-opacity';
}

export interface UseLayerOpacityReturn {
  currentOpacityRef: React.MutableRefObject<number>;
  lastPropOpacityRef: React.MutableRefObject<number>;
  isImperativeChangeRef: React.MutableRefObject<boolean>;
  setOpacity: (opacity: number) => void;
  updateOpacityFromProp: (opacity: number) => void;
}

/**
 * Custom hook to manage layer opacity with support for both prop-based and imperative changes
 * @param options - Configuration options for opacity management
 * @returns Refs and functions for opacity management
 */
export const useLayerOpacity = (
  options: UseLayerOpacityOptions,
): UseLayerOpacityReturn => {
  const { initialOpacity, layerId, map, isMapLoaded, opacityProperty = 'raster-opacity' } = options;

  const currentOpacityRef = useRef<number>(initialOpacity);
  const lastPropOpacityRef = useRef<number>(initialOpacity);
  const isImperativeChangeRef = useRef<boolean>(false);

  // Update opacity on the map
  const setOpacity = (opacity: number) => {
    if (!map || !isMapLoaded) return;
    
    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    currentOpacityRef.current = clampedOpacity;
    isImperativeChangeRef.current = true;
    
    try {
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, opacityProperty, clampedOpacity);
      }
    } catch (error) {
      console.error(`Error setting layer opacity for ${layerId}:`, error);
    }
  };

  // Update opacity from prop changes (not from imperative methods)
  const updateOpacityFromProp = (opacity: number) => {
    if (!isImperativeChangeRef.current) {
      currentOpacityRef.current = opacity;
      lastPropOpacityRef.current = opacity;
    }
    isImperativeChangeRef.current = false;
  };

  return {
    currentOpacityRef,
    lastPropOpacityRef,
    isImperativeChangeRef,
    setOpacity,
    updateOpacityFromProp,
  };
};

