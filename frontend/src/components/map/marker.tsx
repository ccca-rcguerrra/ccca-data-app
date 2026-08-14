import { useEffect, useRef } from 'react';
import { Marker as MapLibreMarker } from 'maplibre-gl';
import { useMap } from './map';
import type { MarkerProps } from './types';

/**
 * Marker - A marker component for MapLibre GL maps
 * @param position - Marker position coordinates [lng, lat]
 * @param color - Marker color (default: '#3b82f6')
 * @param size - Marker size in pixels (default: 20)
 * @param onClick - Callback when marker is clicked
 */
export const Marker = ({
  position,
  color = '#3b82f6',
  size = 20,
  onClick,
}: MarkerProps) => {
  const { map, isMapLoaded } = useMap();
  const markerRef = useRef<MapLibreMarker | null>(null);

  useEffect(() => {
    if (!map || !isMapLoaded) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'maplibre-marker';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    el.style.cursor = onClick ? 'pointer' : 'default';

    // Create and add marker to map
    markerRef.current = new MapLibreMarker({
      element: el,
      anchor: 'center',
    })
      .setLngLat(position)
      .addTo(map);

    // Handle click event
    if (onClick) {
      el.addEventListener('click', onClick);
    }

    // Cleanup function
    return () => {
      if (markerRef.current) {
        try {
          markerRef.current.remove();
        } catch (error) {
          // Map might have been destroyed, ignore errors
          console.warn('Error removing marker:', error);
        }
        markerRef.current = null;
      }
    };
  }, [map, isMapLoaded, position, color, size, onClick]);

  // Update position when it changes
  useEffect(() => {
    if (markerRef.current && isMapLoaded) {
      markerRef.current.setLngLat(position);
    }
  }, [position, isMapLoaded]);

  return null;
};

