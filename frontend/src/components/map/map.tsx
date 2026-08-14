import React, { createContext, useContext, useEffect, useRef, useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { Map as MapLibreMap, MapMouseEvent, MapOptions } from 'maplibre-gl';
import { MAP_CONFIG } from '@/constants';
import type { MapContextValue, MapComponentProps } from './types';
import { createApiAuthTransformRequest } from './utils';
import '@/styles/map.scss';

export const MapContext = createContext<MapContextValue>({
  map: null,
  isMapLoaded: false,
});

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a Map component');
  }
  return context;
};

/**
 * Empty map style - no base layers loaded by default
 */
const EMPTY_MAP_STYLE: MapOptions['style'] = {
  version: 8,
  sources: {},
  layers: [],
};

/**
 * Map component (MapLibre GL). Loads maplibre-gl dynamically or uses injected lib;
 * creates/destroys map instance; renders children when map is ready; exposes map and isMapLoaded via MapContext.
 */
export const Map = ({
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  mapStyle,
  emptyStyle = false,
  className = '',
  id,
  onMapLoad,
  onMapClick,
  mapLib,
  onError,
  onMapDestroy,
  children,
  ...mapInitOptions
}: MapComponentProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Determine initial style: mapStyle takes precedence, then emptyStyle, then default
  const getInitialStyle = (): MapOptions['style'] => {
    if (mapStyle) return mapStyle;
    if (emptyStyle) return EMPTY_MAP_STYLE;
    return MAP_CONFIG.DEFAULT_STYLE;
  };

  const initialStyleRef = useRef<MapOptions['style']>(getInitialStyle());

  // Context value computed from state - ensures children re-render when map loads
  const contextValue = useMemo(
    () => ({ map: mapInstance, isMapLoaded }),
    [mapInstance, isMapLoaded]
  );

  const style: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%'
  };

  const CHILD_CONTAINER_STYLE: CSSProperties = {
    height: '100%',
    position: 'relative',
    width: '100%',
    pointerEvents: 'none' as const
  };

  useEffect(() => {
    if (!containerRef.current || mapInstance) return;

    let isMounted = true;
    let localMapInstance: MapLibreMap | null = null;

    Promise.resolve(mapLib || import('maplibre-gl'))
      .then((module: any) => {
        if (!isMounted) return;

        if (!module) {
          throw new Error('Invalid mapLib');
        }

        const maplibre = 'Map' in module ? module : module.default;
        if (!maplibre || !maplibre.Map) {
          throw new Error('Invalid mapLib');
        }

        // Check browser support
        if (maplibre.supported && !maplibre.supported()) {
          throw new Error('Map is not supported by this browser');
        }

        const initialStyle = mapStyle || (emptyStyle ? EMPTY_MAP_STYLE : MAP_CONFIG.DEFAULT_STYLE);

        localMapInstance = new maplibre.Map({
          container: containerRef.current as HTMLDivElement,
          style: initialStyle,
          center,
          zoom,
          scrollZoom: true, // Enable scroll zoom
          // Disable 3D interactions (tilt/rotate) — the workspace is strictly 2D.
          pitchWithRotate: false,
          dragRotate: false,
          touchPitch: false,
          maxPitch: 0,
          // Attach the JWT to authenticated API requests (e.g. MVT tiles).
          // Can be overridden by passing `transformRequest` via mapInitOptions.
          transformRequest: createApiAuthTransformRequest(),
          ...mapInitOptions
        });

        setMapInstance(localMapInstance);

        // Block two-finger rotation gesture as well (kept separate from zoom).
        localMapInstance.touchZoomRotate.disableRotation();

        // Basic controls — hide the compass button (rotate/pitch reset) since 3D is off.
        localMapInstance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
        localMapInstance.addControl(new maplibre.ScaleControl(), 'bottom-left');

        // Load event
        localMapInstance.on('load', () => {
          if (!isMounted) return;
          setIsMapLoaded(true);
          if (onMapLoad && localMapInstance) {
            onMapLoad(localMapInstance);
          }
        });

        // Click event
        if (onMapClick) {
          localMapInstance.on('click', onMapClick);
        }

        // Handle errors silently (especially abort errors from image loading)
        localMapInstance.on('error', (e: any) => {
          // Ignore abort errors from image sources (common when components unmount)
          if (e?.error?.message?.includes('aborted') || e?.error?.name === 'AbortError') {
            return; // Silently ignore
          }
          // Log other errors but don't break the app
          if (onError) {
            onError(e.error || e);
          }
        });
      })
      .catch((error: any) => {
        if (!isMounted) return;

        const err = error instanceof Error ? error : new Error(String(error));
        const enhancedError = new Error(`Map initialization failed: ${err.message}`);
        enhancedError.stack = err.stack;

        if (onError) {
          onError(enhancedError);
        } else {
          // eslint-disable-next-line no-console
          console.error('Map initialization error:', enhancedError);
        }
      });

    return () => {
      isMounted = false;
      if (localMapInstance) {
        if (onMapDestroy) {
          onMapDestroy(localMapInstance);
        }
        localMapInstance.remove();
        localMapInstance = null;
      }
      setMapInstance(null);
      setIsMapLoaded(false);
    };
    // Dependencies omitted intentionally - map should only initialize once on mount
    // Changing center/zoom/style is handled by separate useEffect hooks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync center/zoom when props change and map is loaded
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      mapInstance.setCenter(center);
      mapInstance.setZoom(zoom);
    }
  }, [center, zoom, isMapLoaded, mapInstance]);

  // Sync map style when mapStyle or emptyStyle change (skip initial style)
  useEffect(() => {
    if (mapInstance && isMapLoaded) {
      const newStyle = mapStyle || (emptyStyle ? EMPTY_MAP_STYLE : MAP_CONFIG.DEFAULT_STYLE);
      if (newStyle !== initialStyleRef.current) {
        mapInstance.setStyle(newStyle);
        initialStyleRef.current = newStyle;
      }
    }
  }, [mapStyle, emptyStyle, isMapLoaded, mapInstance]);

  return (
    <div id={id} ref={containerRef} style={style} className={className}>
      {mapInstance && (
        <MapContext.Provider value={contextValue}>
          <div mapboxgl-children="" style={CHILD_CONTAINER_STYLE}>
            {children}
          </div>
        </MapContext.Provider>
      )}
    </div>
  );
};
