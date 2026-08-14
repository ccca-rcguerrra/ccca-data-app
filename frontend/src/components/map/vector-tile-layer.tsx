import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useMap } from './map';
import { getInsertBeforeId, safeMapLayersMutation } from './utils';
import type { MapLayerRef, VectorTileLayerProps } from './types';
import { useStyleVersion } from './hooks/use-style-version';
import { geometryLayerStyles } from '@/constants/geometry-styles.constants';

const defaultStyle = geometryLayerStyles.alertBase;

/**
 * VectorTileLayer - Displays a Mapbox Vector Tile (MVT) source on the map.
 *
 * Renders three sublayers from a single vector `source-layer`:
 * - fill + line for polygon features (high zoom)
 * - circle for point features (low-zoom centroids)
 *
 * The tile URL must point to the authenticated API endpoint; the JWT is added
 * automatically by the map `transformRequest` configured in the Map component.
 */
export const VectorTileLayer = forwardRef<MapLayerRef, VectorTileLayerProps>(
  (
    {
      id,
      url,
      sourceLayer,
      promoteId,
      fillColor = defaultStyle.fillColor,
      fillOpacity = 0.25,
      lineColor = defaultStyle.lineColor,
      lineWidth = defaultStyle.lineWidth,
      lineOpacity = 1,
      circleColor = defaultStyle.lineColor,
      circleRadius = 4,
      opacity = 1,
      minzoom,
      maxzoom,
      beforeId,
      zIndex,
      lazy = false,
    },
    ref,
  ) => {
    const { map, isMapLoaded } = useMap();

    const generatedIdRef = useRef<string>();
    if (!generatedIdRef.current) {
      generatedIdRef.current = crypto.randomUUID();
    }
    const resolvedId = id ?? generatedIdRef.current;

    const sourceId = `vector-source-${resolvedId}`;
    const fillLayerId = `vector-fill-${resolvedId}`;
    const outlineLayerId = `vector-outline-${resolvedId}`;
    const circleLayerId = `vector-circle-${resolvedId}`;

    const currentOpacityRef = useRef<number>(opacity);
    const isDestroyedRef = useRef<boolean>(false);
    const lazyRef = useRef<boolean>(lazy);

    const styleVersion = useStyleVersion(map);

    useEffect(() => {
      lazyRef.current = lazy;
    }, [lazy]);

    const createSourceAndLayers = useCallback(
      (targetMap: typeof map) => {
        if (!targetMap) return false;

        if (!targetMap.getSource(sourceId)) {
          try {
            targetMap.addSource(sourceId, {
              type: 'vector',
              tiles: [url],
              ...(promoteId ? { promoteId: { [sourceLayer]: promoteId } } : {}),
              ...(minzoom !== undefined ? { minzoom } : {}),
              ...(maxzoom !== undefined ? { maxzoom } : {}),
            });
          } catch (error) {
            console.error('Error creating vector tile source:', error);
            return false;
          }
        }

        const insertBeforeId = getInsertBeforeId(targetMap, fillLayerId, zIndex, beforeId);
        const baseMeta = zIndex !== undefined ? { metadata: { zIndex } } : {};
        const o = currentOpacityRef.current;

        // Fill layer (polygons)
        if (!targetMap.getLayer(fillLayerId)) {
          try {
            targetMap.addLayer(
              {
                id: fillLayerId,
                type: 'fill',
                source: sourceId,
                'source-layer': sourceLayer,
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                  'fill-color': fillColor,
                  'fill-opacity': typeof fillOpacity === 'number' ? fillOpacity * o : fillOpacity,
                },
                ...baseMeta,
              } as any,
              insertBeforeId,
            );
          } catch (error) {
            console.error('Error creating vector fill layer:', error);
            return false;
          }
        }

        // Outline layer (polygons)
        if (!targetMap.getLayer(outlineLayerId)) {
          const outlineBeforeId = targetMap.getLayer(fillLayerId) ? fillLayerId : insertBeforeId;
          try {
            targetMap.addLayer(
              {
                id: outlineLayerId,
                type: 'line',
                source: sourceId,
                'source-layer': sourceLayer,
                filter: ['==', ['geometry-type'], 'Polygon'],
                paint: {
                  'line-color': lineColor,
                  'line-width': lineWidth,
                  'line-opacity': typeof lineOpacity === 'number' ? lineOpacity * o : lineOpacity,
                },
                ...baseMeta,
              } as any,
              outlineBeforeId,
            );
          } catch (error) {
            console.error('Error creating vector outline layer:', error);
            return false;
          }
        }

        // Circle layer (point centroids at low zoom)
        if (!targetMap.getLayer(circleLayerId)) {
          try {
            targetMap.addLayer(
              {
                id: circleLayerId,
                type: 'circle',
                source: sourceId,
                'source-layer': sourceLayer,
                filter: ['==', ['geometry-type'], 'Point'],
                paint: {
                  'circle-color': circleColor,
                  'circle-radius': circleRadius,
                  'circle-opacity': o,
                  'circle-stroke-color': lineColor,
                  'circle-stroke-width': 1,
                  'circle-stroke-opacity': o,
                },
                ...baseMeta,
              } as any,
              insertBeforeId,
            );
          } catch (error) {
            console.error('Error creating vector circle layer:', error);
            return false;
          }
        }

        return true;
      },
      [
        sourceId,
        url,
        sourceLayer,
        promoteId,
        fillLayerId,
        outlineLayerId,
        circleLayerId,
        fillColor,
        fillOpacity,
        lineColor,
        lineWidth,
        lineOpacity,
        circleColor,
        circleRadius,
        minzoom,
        maxzoom,
        zIndex,
        beforeId,
      ],
    );

    const destroySourceAndLayers = useCallback(
      (targetMap: typeof map, isImperative = false) => {
        if (!targetMap) return false;
        safeMapLayersMutation(targetMap, (m) => {
          for (const layerId of [circleLayerId, outlineLayerId, fillLayerId]) {
            if (m.getLayer(layerId)) {
              m.removeLayer(layerId);
            }
          }
          if (m.getSource(sourceId)) {
            m.removeSource(sourceId);
          }
        });
        if (isImperative) {
          isDestroyedRef.current = true;
        }
        return true;
      },
      [circleLayerId, outlineLayerId, fillLayerId, sourceId],
    );

    const applyOpacity = useCallback(
      (newOpacity: number) => {
        const clamped = Math.max(0, Math.min(1, newOpacity));
        currentOpacityRef.current = clamped;
        if (!map) return;
        try {
          if (map.getLayer(fillLayerId)) {
            const fillOpacityValue =
              typeof fillOpacity === 'number'
                ? fillOpacity * clamped
                : clamped === 0
                  ? 0
                  : fillOpacity;
            map.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacityValue as never);
          }
          if (map.getLayer(outlineLayerId)) {
            // Preserve a data/zoom-driven line-opacity expression; only the
            // numeric base is scaled by the layer toggle (hide forces 0).
            const lineOpacityValue =
              typeof lineOpacity === 'number'
                ? lineOpacity * clamped
                : clamped === 0
                  ? 0
                  : lineOpacity;
            map.setPaintProperty(outlineLayerId, 'line-opacity', lineOpacityValue as never);
          }
          if (map.getLayer(circleLayerId)) {
            map.setPaintProperty(circleLayerId, 'circle-opacity', clamped);
            map.setPaintProperty(circleLayerId, 'circle-stroke-opacity', clamped);
          }
        } catch (error) {
          console.error('Error setting vector layer opacity:', error);
        }
      },
      [map, fillLayerId, outlineLayerId, circleLayerId, fillOpacity, lineOpacity],
    );

    useImperativeHandle(
      ref,
      () => ({
        setOpacity: (newOpacity: number) => applyOpacity(newOpacity),
        getOpacity: () => currentOpacityRef.current,
        show: () => applyOpacity(opacity ?? 1),
        hide: () => applyOpacity(0),
        isVisible: () => {
          if (!map) return false;
          try {
            return (
              map.getLayer(fillLayerId) !== undefined ||
              map.getLayer(outlineLayerId) !== undefined ||
              map.getLayer(circleLayerId) !== undefined
            );
          } catch {
            return false;
          }
        },
        isLazy: () => lazyRef.current,
        getLayerId: () => fillLayerId,
        create: () => {
          if (!map || !isMapLoaded) return;
          isDestroyedRef.current = false;
          createSourceAndLayers(map);
        },
        destroy: () => {
          if (!map || !isMapLoaded) return;
          destroySourceAndLayers(map, true);
        },
      }),
      [
        map,
        isMapLoaded,
        applyOpacity,
        opacity,
        fillLayerId,
        outlineLayerId,
        circleLayerId,
        createSourceAndLayers,
        destroySourceAndLayers,
      ],
    );

    useEffect(() => {
      if (!map || !isMapLoaded) return;
      if (isDestroyedRef.current) return;
      if (lazy) return;

      createSourceAndLayers(map);
    }, [map, isMapLoaded, lazy, styleVersion, createSourceAndLayers]);

    // Update tile URLs in place when the URL (e.g. filters) changes, without
    // recreating the source/layers.
    useEffect(() => {
      if (!map || !isMapLoaded) return;
      const source = map.getSource(sourceId) as { setTiles?: (tiles: string[]) => void } | undefined;
      if (source && typeof source.setTiles === 'function') {
        source.setTiles([url]);
      }
    }, [url, map, isMapLoaded, sourceId]);

    // Sync paint colors in place when they change (e.g. a data-driven
    // expression based on feature-state or a feature property).
    useEffect(() => {
      if (!map || !isMapLoaded) return;
      try {
        if (map.getLayer(fillLayerId)) {
          map.setPaintProperty(fillLayerId, 'fill-color', fillColor as never);
        }
        if (map.getLayer(outlineLayerId)) {
          map.setPaintProperty(outlineLayerId, 'line-color', lineColor as never);
        }
        if (map.getLayer(circleLayerId)) {
          map.setPaintProperty(circleLayerId, 'circle-color', circleColor as never);
          map.setPaintProperty(circleLayerId, 'circle-stroke-color', lineColor as never);
        }
      } catch (error) {
        console.error('Error updating vector layer paint:', error);
      }
    }, [map, isMapLoaded, fillColor, lineColor, circleColor, fillLayerId, outlineLayerId, circleLayerId]);

    useEffect(() => {
      if (!map) return;
      return () => {
        destroySourceAndLayers(map);
      };
    }, [map, destroySourceAndLayers]);

    return null;
  },
);

VectorTileLayer.displayName = 'VectorTileLayer';
