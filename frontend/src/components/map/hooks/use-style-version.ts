import { useEffect, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

/**
 * Custom hook to track map style version changes
 * @param map - MapLibre map instance
 * @returns Current style version number
 */
export const useStyleVersion = (map: MapLibreMap | null): number => {
  const [styleVersion, setStyleVersion] = useState(0);

  useEffect(() => {
    if (!map) return;

    const handleStyleData = () => {
      setStyleVersion((version) => version + 1);
    };

    map.on('styledata', handleStyleData);
    handleStyleData();

    return () => {
      // Check if map is still valid before removing listener
      if (map && map.off) {
        try {
          map.off('styledata', handleStyleData);
        } catch (error) {
          // Map might have been destroyed, ignore errors
          console.warn('Error removing styledata listener:', error);
        }
      }
    };
  }, [map]);

  return styleVersion;
};

