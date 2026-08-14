import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { useMap } from './map';
import type { MapLayerRef, WMTSTileLayerProps } from './types';
import { getInsertBeforeId, safeMapLayersMutation } from './utils';
import { useLayerOpacity } from './hooks/use-layer-opacity';
import { useLayerLifecycle } from './hooks/use-layer-lifecycle';
import { useStyleVersion } from './hooks/use-style-version';

/**
 * WMTSTileLayer - Component to display WMTS tile layers on the map
 * 
 * @param id - Unique identifier for the layer
 * @param url - WMTS service URL
 * @param layers - WMTS layer names
 * @param styles - WMTS styles (optional)
 * @param format - Image format (default: 'image/png')
 * @param transparent - Enable transparency (default: true)
 * @param version - WMTS version (default: '1.0.0')
 * @param tilematrixSet - Tile matrix set identifier (default: 'EPSG:3857')
 * @param attribution - Attribution text (optional)
 * @param opacity - Layer opacity 0-1 (default: 1)
 * @param beforeId - Layer ID to insert this layer before (optional)
 */
export const WMTSTileLayer = forwardRef<MapLayerRef, WMTSTileLayerProps>(
  (
    {
      id,
      url,
      layers,
      styles = '',
      format = 'image/png',
      transparent = true,
      version = '1.0.0',
      tilematrixSet = 'EPSG:3857',
      attribution = '',
      opacity = 1,
      beforeId,
      zIndex,
      lazy = false,
    },
    ref
  ) => {
    const { map, isMapLoaded } = useMap();
    const lazyRef = useRef<boolean>(lazy);

    const generatedIdRef = useRef<string>();
    if (!generatedIdRef.current) {
      generatedIdRef.current = crypto.randomUUID();
    }
    const resolvedId = id ?? generatedIdRef.current;

    const sourceId = `wmts-source-${resolvedId}`;
    const layerId = `wmts-layer-${resolvedId}`;

    // Build WMTS tiles URL
    // WMTS uses tilematrix, tilerow, tilecol instead of bbox
    // Format: {z} for zoom level, {x} for tile column, {y} for tile row
    const tilesUrl = useMemo(
      () => `${url}?service=WMTS&request=GetTile&version=${version}&layer=${encodeURIComponent(layers)}&style=${encodeURIComponent(styles)}&tilematrixSet=${encodeURIComponent(tilematrixSet)}&format=${encodeURIComponent(format)}&height=256&width=256&transparent=${transparent}&tilematrix=${encodeURIComponent(tilematrixSet)}:{z}&tilerow={y}&tilecol={x}`,
      [url, version, layers, styles, tilematrixSet, format, transparent]
    );

    // Use opacity hook
    const {
      currentOpacityRef,
      lastPropOpacityRef,
      isImperativeChangeRef,
      setOpacity,
      updateOpacityFromProp,
    } = useLayerOpacity({
      initialOpacity: opacity,
      layerId,
      map,
      isMapLoaded,
      opacityProperty: 'raster-opacity',
    });

    // Use style version hook
    const styleVersion = useStyleVersion(map);

    // Helper function to create source and layer (reusable)
    const createSourceAndLayer = useCallback((targetMap: typeof map) => {
      if (!targetMap) return false;

      const source = targetMap.getSource(sourceId);

      // Add source if it doesn't exist
      if (!source) {
        try {
          targetMap.addSource(sourceId, {
            type: 'raster',
            tiles: [tilesUrl],
            tileSize: 256,
            attribution: attribution || undefined,
          });
        } catch (error) {
          console.error('Error creating layer source:', error);
          return false;
        }
      }

      // Add layer if it doesn't exist
      if (!targetMap.getLayer(layerId)) {
        // Determine the correct beforeId based on zIndex or explicit beforeId
        const insertBeforeId = getInsertBeforeId(targetMap, layerId, zIndex, beforeId);

        try {
          const layerSpec: any = {
            id: layerId,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': currentOpacityRef.current,
            },
          };

          // Store zIndex in metadata for future reference
          if (zIndex !== undefined) {
            layerSpec.metadata = { zIndex };
          }

          targetMap.addLayer(layerSpec, insertBeforeId);
          return true;
        } catch (error) {
          console.error('Error creating layer:', error);
          return false;
        }
      }

      return true;
    }, [sourceId, layerId, tilesUrl, attribution, beforeId, zIndex, currentOpacityRef]);

    // Helper function to destroy source and layer (reusable)
    const destroySourceAndLayer = useCallback((targetMap: typeof map) => {
      if (!targetMap) return false;
      safeMapLayersMutation(targetMap, (m) => {
        if (m.getLayer(layerId)) {
          m.removeLayer(layerId);
        }
        if (m.getSource(sourceId)) {
          m.removeSource(sourceId);
        }
      });
      return true;
    }, [layerId, sourceId]);

    // Use lifecycle hook
    const { isDestroyedRef, create: createLayer, destroy: destroyLayer } = useLayerLifecycle({
      sourceId,
      layerId,
      map,
      isMapLoaded,
      createLayer: createSourceAndLayer,
      destroyLayer: destroySourceAndLayer,
    });

    // Update opacity from prop changes
    useEffect(() => {
      updateOpacityFromProp(opacity);
    }, [opacity, updateOpacityFromProp]);

    // Update lazy ref when prop changes
    useEffect(() => {
      lazyRef.current = lazy;
    }, [lazy]);

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
      setOpacity: (newOpacity: number) => {
        setOpacity(newOpacity);
      },
      getOpacity: () => {
        return currentOpacityRef.current;
      },
      show: () => {
        setOpacity(1);
      },
      hide: () => {
        setOpacity(0);
      },
      isVisible: () => {
        if (!map) return false;
        try {
          return map.getLayer(layerId) !== undefined;
        } catch {
          return false;
        }
      },
      isLazy: () => {
        return lazyRef.current;
      },
      getLayerId: () => {
        return layerId;
      },
      create: () => {
        createLayer();
      },
      destroy: () => {
        destroyLayer();
      },
    }), [map, setOpacity, currentOpacityRef, lazyRef, layerId, createLayer, destroyLayer]);

    useEffect(() => {
      if (!map || !isMapLoaded) return;
      if (isDestroyedRef.current) return; // Don't recreate if destroyed imperatively
      if (lazy) return; // Don't create if lazy is true

      const currentMap = map;

      // Create source and layer if they don't exist
      createSourceAndLayer(currentMap);

      // If layer already exists, update opacity
      if (currentMap.getLayer(layerId)) {
        // Update opacity only if prop changed (not from imperative methods)
        // Check if this is a prop change or an imperative change
        if (!isImperativeChangeRef.current && opacity !== lastPropOpacityRef.current) {
          // Prop changed, update both ref and map
          currentOpacityRef.current = opacity;
          lastPropOpacityRef.current = opacity;
          currentMap.setPaintProperty(layerId, 'raster-opacity', opacity);
        } else if (isImperativeChangeRef.current) {
          // Imperative change was made, just ensure map is in sync with ref
          const currentLayerOpacity = currentMap.getPaintProperty(layerId, 'raster-opacity') as number | undefined;
          if (currentLayerOpacity !== currentOpacityRef.current) {
            currentMap.setPaintProperty(layerId, 'raster-opacity', currentOpacityRef.current);
          }
          isImperativeChangeRef.current = false;
        }
      }
    }, [
      map,
      isMapLoaded,
      lazy,
      sourceId,
      layerId,
      tilesUrl,
      attribution,
      opacity,
      styleVersion,
      beforeId,
      createSourceAndLayer,
    ]);

    useEffect(() => {
      if (!map) return;

      return () => {
        destroySourceAndLayer(map);
      };
    }, [map, destroySourceAndLayer]);

    return null;
  }
);

WMTSTileLayer.displayName = 'WMTSTileLayer';

