import { useEffect, useMemo, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useMap } from './map';
import type { GeoJSONSource } from 'maplibre-gl';
import { normalizeGeoJSON, getFeatureBounds, findBeforeIdByZIndex, safeMapLayersMutation } from './utils';
import type { MapLayerRef, GeoJSONLayerProps } from './types';
import { useStyleVersion } from './hooks/use-style-version';
import { geometryLayerStyles } from '@/constants/geometry-styles.constants';

const defaultStyle = geometryLayerStyles.alertBase;

export const GeoJSONLayer = forwardRef<MapLayerRef, GeoJSONLayerProps>(({
  id,
  data,
  style = defaultStyle,
  fitBounds = false,
  zIndex,
  beforeId,
  lazy = false,
}, ref) => {
  const { map, isMapLoaded } = useMap();

  const generatedIdRef = useRef<string>();
  if (!generatedIdRef.current) {
    generatedIdRef.current = crypto.randomUUID();
  }
  const resolvedId = id ?? generatedIdRef.current;

  const sourceId = `source-${resolvedId}`;
  const fillLayerId = `fill-${resolvedId}`;
  const outlineLayerId = `outline-${resolvedId}`;

  const normalizedData = useMemo(() => normalizeGeoJSON(data), [data]);

  const fillColor = style.fillColor ?? defaultStyle.fillColor;
  const fillOpacity = style.fillOpacity ?? defaultStyle.fillOpacity;
  const lineColor = style.lineColor ?? defaultStyle.lineColor;
  const lineOpacity = style.lineOpacity ?? 1;
  const lineWidth = style.lineWidth ?? defaultStyle.lineWidth;
  const lineDasharray = style.lineDasharray;

  // Refs for opacity control (initialized after fillOpacity is defined)
  // GeoJSONLayer has two layers (fill + outline), so we manage opacity separately
  const currentFillOpacityRef = useRef<number>(fillOpacity);
  const currentLineOpacityRef = useRef<number>(lineOpacity);
  const lastPropFillOpacityRef = useRef<number>(fillOpacity);
  const lastPropLineOpacityRef = useRef<number>(lineOpacity);
  const isImperativeChangeRef = useRef<boolean>(false);
  const isDestroyedRef = useRef<boolean>(false);
  const lazyRef = useRef<boolean>(lazy);

  // Use style version hook
  const styleVersion = useStyleVersion(map);

  // Update opacity refs when prop changes (only if not from imperative method)
  useEffect(() => {
    if (!isImperativeChangeRef.current) {
      currentFillOpacityRef.current = fillOpacity;
      lastPropFillOpacityRef.current = fillOpacity;
      currentLineOpacityRef.current = lineOpacity;
      lastPropLineOpacityRef.current = lineOpacity;
    }
    isImperativeChangeRef.current = false;
  }, [fillOpacity, lineOpacity]);

  // Update lazy ref when prop changes
  useEffect(() => {
    lazyRef.current = lazy;
  }, [lazy]);

  // Helper function to create source and layers (reusable)
  const createSourceAndLayers = useCallback((targetMap: typeof map) => {
    if (!targetMap) return false;

    const source = targetMap.getSource(sourceId) as GeoJSONSource | undefined;

    // Add or update source
    if (source) {
      source.setData(normalizedData);
    } else {
      try {
        targetMap.addSource(sourceId, {
          type: 'geojson',
          data: normalizedData,
        });
      } catch (error) {
        console.error('Error creating GeoJSON source:', error);
        return false;
      }
    }

    // Determine the correct beforeId based on zIndex or explicit beforeId
    // For GeoJSONLayer, we exclude both fill and outline layers from zIndex calculation
    let insertBeforeId: string | undefined = beforeId;
    if (zIndex !== undefined) {
      insertBeforeId = findBeforeIdByZIndex(targetMap, [fillLayerId, outlineLayerId], zIndex, beforeId);
    }
    if (insertBeforeId && !targetMap.getLayer(insertBeforeId)) {
      console.warn(`Layer "${insertBeforeId}" does not exist yet, adding GeoJSON layer without beforeId`);
      insertBeforeId = undefined;
    }

    // Add fill layer if it doesn't exist
    if (!targetMap.getLayer(fillLayerId)) {
      const fillLayerSpec: any = {
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        paint: {
          'fill-color': fillColor,
          'fill-opacity': currentFillOpacityRef.current,
        },
      };

      // Store zIndex in metadata for future reference
      if (zIndex !== undefined) {
        fillLayerSpec.metadata = { zIndex };
      }

      try {
        targetMap.addLayer(fillLayerSpec, insertBeforeId);
      } catch (error) {
        console.error('Error creating fill layer:', error);
        return false;
      }
    }

    // Add outline layer if it doesn't exist
    if (!targetMap.getLayer(outlineLayerId)) {
      const outlineLayerSpec: any = {
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': lineColor,
          'line-width': lineWidth,
          'line-dasharray': lineDasharray ?? [1, 0],
          'line-opacity': currentLineOpacityRef.current,
        },
      };

      // Store zIndex in metadata for future reference
      if (zIndex !== undefined) {
        outlineLayerSpec.metadata = { zIndex };
      }

      // Outline layer should always be above fill layer
      // If fill layer exists, insert outline before it, otherwise use the same beforeId
      const outlineBeforeId = targetMap.getLayer(fillLayerId) ? fillLayerId : insertBeforeId;
      try {
        targetMap.addLayer(outlineLayerSpec, outlineBeforeId);
      } catch (error) {
        console.error('Error creating outline layer:', error);
        return false;
      }
    }

    return true;
  }, [
    sourceId,
    normalizedData,
    fillLayerId,
    outlineLayerId,
    fillColor,
    lineColor,
    lineOpacity,
    lineWidth,
    lineDasharray,
    zIndex,
    beforeId,
    currentFillOpacityRef,
    currentLineOpacityRef,
  ]);

  // Helper function to destroy source and layers (reusable)
  const destroySourceAndLayers = useCallback((targetMap: typeof map, isImperative = false) => {
    if (!targetMap) return false;

    safeMapLayersMutation(targetMap, (m) => {
      if (m.getLayer(outlineLayerId)) {
        m.removeLayer(outlineLayerId);
      }
      if (m.getLayer(fillLayerId)) {
        m.removeLayer(fillLayerId);
      }
      if (m.getSource(sourceId)) {
        m.removeSource(sourceId);
      }
    });

    if (isImperative) {
      isDestroyedRef.current = true;
    }

    return true;
  }, [fillLayerId, outlineLayerId, sourceId]);

  // Expose imperative methods via ref
  useImperativeHandle(ref, () => ({
    setOpacity: (newOpacity: number) => {
      if (!map || !isMapLoaded) return;
      
      const clampedOpacity = Math.max(0, Math.min(1, newOpacity));
      currentFillOpacityRef.current = clampedOpacity;
      currentLineOpacityRef.current = clampedOpacity;
      isImperativeChangeRef.current = true;
      
      try {
        if (map.getLayer(fillLayerId)) {
          map.setPaintProperty(fillLayerId, 'fill-opacity', clampedOpacity);
        }
        if (map.getLayer(outlineLayerId)) {
          map.setPaintProperty(outlineLayerId, 'line-opacity', clampedOpacity);
        }
      } catch (error) {
        console.error('Error setting layer opacity:', error);
      }
    },
    getOpacity: () => {
      return currentFillOpacityRef.current;
    },
    show: () => {
      if (!map || !isMapLoaded) return;
      
      // Restore to original fill opacity from props, or use 1 if not set
      const targetOpacity = fillOpacity ?? 1;
      currentFillOpacityRef.current = targetOpacity;
      currentLineOpacityRef.current = 1;
      isImperativeChangeRef.current = true;
      
      try {
        if (map.getLayer(fillLayerId)) {
          map.setPaintProperty(fillLayerId, 'fill-opacity', targetOpacity);
        }
        if (map.getLayer(outlineLayerId)) {
          map.setPaintProperty(outlineLayerId, 'line-opacity', 1);
        }
      } catch (error) {
        console.error('Error showing layer:', error);
      }
    },
    hide: () => {
      if (!map || !isMapLoaded) return;
      
      currentFillOpacityRef.current = 0;
      currentLineOpacityRef.current = 0;
      isImperativeChangeRef.current = true;
      
      try {
        if (map.getLayer(fillLayerId)) {
          map.setPaintProperty(fillLayerId, 'fill-opacity', 0);
        }
        if (map.getLayer(outlineLayerId)) {
          map.setPaintProperty(outlineLayerId, 'line-opacity', 0);
        }
      } catch (error) {
        console.error('Error hiding layer:', error);
      }
    },
    isVisible: () => {
      if (!map) return false;
      try {
        return map.getLayer(fillLayerId) !== undefined || map.getLayer(outlineLayerId) !== undefined;
      } catch {
        return false;
      }
    },
    isLazy: () => {
      return lazyRef.current;
    },
    getLayerId: () => {
      return fillLayerId;
    },
    create: () => {
      if (!map || !isMapLoaded) return;
      isDestroyedRef.current = false; // Reset destroyed flag
      createSourceAndLayers(map);
    },
    destroy: () => {
      if (!map || !isMapLoaded) return;
      destroySourceAndLayers(map, true); // true indicates imperative call
    },
  }), [map, isMapLoaded, fillLayerId, outlineLayerId, fillOpacity, createSourceAndLayers, destroySourceAndLayers]);

  useEffect(() => {
    if (!map || !isMapLoaded) return;
    if (isDestroyedRef.current) return; // Don't recreate if destroyed imperatively
    if (lazy) return; // Don't create if lazy is true

    const currentMap = map;

    // Create source and layers if they don't exist
    createSourceAndLayers(currentMap);

    // If layers already exist, update properties
    if (currentMap.getLayer(fillLayerId)) {
      // Update fill color
      currentMap.setPaintProperty(fillLayerId, 'fill-color', fillColor);
      
      // Update opacity only if prop changed (not from imperative methods)
      if (!isImperativeChangeRef.current && fillOpacity !== lastPropFillOpacityRef.current) {
        // Prop changed, update both ref and map
        currentFillOpacityRef.current = fillOpacity;
        lastPropFillOpacityRef.current = fillOpacity;
        currentMap.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacity);
      } else if (isImperativeChangeRef.current) {
        // Imperative change was made, just ensure map is in sync with ref
        const currentLayerOpacity = currentMap.getPaintProperty(fillLayerId, 'fill-opacity') as number | undefined;
        if (currentLayerOpacity !== currentFillOpacityRef.current) {
          currentMap.setPaintProperty(fillLayerId, 'fill-opacity', currentFillOpacityRef.current);
        }
        isImperativeChangeRef.current = false;
      }
    }

    if (currentMap.getLayer(outlineLayerId)) {
      // Update outline properties
      currentMap.setPaintProperty(outlineLayerId, 'line-color', lineColor);
      currentMap.setPaintProperty(outlineLayerId, 'line-width', lineWidth);
      currentMap.setPaintProperty(outlineLayerId, 'line-dasharray', lineDasharray ?? [1, 0]);

      if (!isImperativeChangeRef.current && lineOpacity !== lastPropLineOpacityRef.current) {
        currentLineOpacityRef.current = lineOpacity;
        lastPropLineOpacityRef.current = lineOpacity;
        currentMap.setPaintProperty(outlineLayerId, 'line-opacity', lineOpacity);
      } else if (isImperativeChangeRef.current) {
        const currentLayerLineOpacity = currentMap.getPaintProperty(outlineLayerId, 'line-opacity') as
          | number
          | undefined;
        if (currentLayerLineOpacity !== currentLineOpacityRef.current) {
          currentMap.setPaintProperty(outlineLayerId, 'line-opacity', currentLineOpacityRef.current);
        }
      }
    }
  }, [
    map,
    isMapLoaded,
    lazy,
    normalizedData,
    fillColor,
    fillOpacity,
    lineColor,
    lineOpacity,
    lineWidth,
    lineDasharray,
    fillLayerId,
    outlineLayerId,
    sourceId,
    styleVersion,
    zIndex,
    beforeId,
    createSourceAndLayers,
  ]);

  useEffect(() => {
    if (!map) return;

    return () => {
      destroySourceAndLayers(map);
    };
  }, [map, destroySourceAndLayers]);

  // Track if fitBounds has been applied to avoid re-applying on style changes
  const fitBoundsAppliedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!map || !isMapLoaded || !fitBounds) return;

    const currentMap = map;
    const bounds = getFeatureBounds(normalizedData);
    if (!bounds) return;

    // Only apply fitBounds once when data changes, not on style changes
    if (fitBoundsAppliedRef.current) return;

    const [minLng, minLat, maxLng, maxLat] = bounds;
    let isCancelled = false;

    const applyFitBounds = () => {
      if (isCancelled) return;
      fitBoundsAppliedRef.current = true;
      currentMap.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        { padding: 24, duration: 400 },
      );
    };

    if (currentMap.isStyleLoaded()) {
      applyFitBounds();
    } else {
      currentMap.once('idle', applyFitBounds);
    }

    return () => {
      isCancelled = true;
      // Check if map is still valid before removing listener
      if (currentMap && currentMap.off) {
        try {
          currentMap.off('idle', applyFitBounds);
        } catch (error) {
          // Map might have been destroyed, ignore errors
          console.warn('Error removing idle listener:', error);
        }
      }
    };
  }, [map, isMapLoaded, fitBounds, normalizedData]);

  // Reset fitBounds flag when normalizedData changes
  useEffect(() => {
    fitBoundsAppliedRef.current = false;
  }, [normalizedData]);

  return null;
});

GeoJSONLayer.displayName = 'GeoJSONLayer';
