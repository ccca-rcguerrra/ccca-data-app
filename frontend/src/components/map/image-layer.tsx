import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { useMap } from './map';
import type { MapLayerRef, ImageLayerProps } from './types';
import { getInsertBeforeId, getFeatureBounds, safeMapLayersMutation } from './utils';
import { useLayerOpacity } from './hooks/use-layer-opacity';
import { useLayerLifecycle } from './hooks/use-layer-lifecycle';
import { useStyleVersion } from './hooks/use-style-version';

/**
 * ImageLayer - Component to display a single image with specified bounds on the map
 * 
 * Uses MapLibre's "image" source type to display an image within geographic bounds.
 * The image is stretched to fit the specified bounds.
 * 
 * @param id - Unique identifier for the layer
 * @param url - URL of the image to display
 * @param bounds - Bounds as [minLng, minLat, maxLng, maxLat] or GeoJSON FeatureCollection
 * @param attribution - Attribution text (optional)
 * @param opacity - Layer opacity 0-1 (default: 1)
 * @param transparent - Enable transparency (default: false)
 * @param beforeId - Layer ID to insert this layer before (optional)
 * @param zIndex - Z-index for layer ordering (higher values render on top)
 * @param lazy - If true, layer will not be created automatically on mount
 */
export const ImageLayer = forwardRef<MapLayerRef, ImageLayerProps>(
  (
    {
      id,
      url,
      bounds,
      attribution = '',
      opacity = 1,
      transparent = false,
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

    const sourceId = `image-source-${resolvedId}`;
    const layerId = `image-layer-${resolvedId}`;

    // Convert bounds to coordinates format required by MapLibre image source
    // Coordinates format: [[minLng, maxLat], [maxLng, maxLat], [maxLng, minLat], [minLng, minLat]]
    const coordinates = useMemo(() => {
      let boundsArray: [number, number, number, number];

      // If bounds is a GeoJSON FeatureCollection, extract bounds using turf
      if (Array.isArray(bounds) && bounds.length === 4) {
        boundsArray = bounds as [number, number, number, number];
      } else if (bounds && typeof bounds === 'object' && 'features' in bounds) {
        // GeoJSON FeatureCollection
        const featureBounds = getFeatureBounds(bounds);
        if (!featureBounds) {
          console.warn('Could not extract bounds from GeoJSON FeatureCollection');
          return null;
        }
        boundsArray = featureBounds;
      } else {
        console.warn('Invalid bounds format. Expected [minLng, minLat, maxLng, maxLat] or GeoJSON FeatureCollection');
        return null;
      }

      const [minLng, minLat, maxLng, maxLat] = boundsArray;

      // Return coordinates in the format required by MapLibre image source
      // Top-left, top-right, bottom-right, bottom-left
      return [
        [minLng, maxLat], // Top-left
        [maxLng, maxLat], // Top-right
        [maxLng, minLat], // Bottom-right
        [minLng, minLat], // Bottom-left
      ] as [[number, number], [number, number], [number, number], [number, number]];
    }, [bounds]);

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
      if (!targetMap || !coordinates) return false;

      const source = targetMap.getSource(sourceId);

      // Add or update source if it doesn't exist or URL changed
      if (!source) {
        try {
          targetMap.addSource(sourceId, {
            type: 'image',
            url: url,
            coordinates: coordinates,
          });
        } catch (error: any) {
          // Ignore abort errors (component unmounted or URL changed)
          if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
            return false;
          }
          console.error('Error creating image source:', error);
          return false;
        }
      } else {
        // Update existing source if URL or coordinates changed
        try {
          const imageSource = source as any;
          if (imageSource.updateImage) {
            imageSource.updateImage({
              url: url,
              coordinates: coordinates,
            });
          }
        } catch (error: any) {
          // Ignore abort errors (component unmounted or URL changed)
          if (error?.message?.includes('aborted') || error?.name === 'AbortError') {
            return false;
          }
          console.warn('Error updating image source:', error);
          // If update fails, remove and recreate
          try {
            targetMap.removeSource(sourceId);
            targetMap.addSource(sourceId, {
              type: 'image',
              url: url,
              coordinates: coordinates,
            });
          } catch (recreateError: any) {
            // Ignore abort errors
            if (recreateError?.message?.includes('aborted') || recreateError?.name === 'AbortError') {
              return false;
            }
            console.error('Error recreating image source:', recreateError);
            return false;
          }
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
          console.error('Error creating image layer:', error);
          return false;
        }
      }

      return true;
    }, [sourceId, layerId, url, coordinates, beforeId, zIndex, currentOpacityRef]);

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
      if (!coordinates) return; // Don't create if coordinates are invalid

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
      url,
      coordinates,
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

ImageLayer.displayName = 'ImageLayer';

