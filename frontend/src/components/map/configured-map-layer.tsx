import { forwardRef } from 'react';
import { TileLayer } from './tile-layer';
import { WMSTileLayer } from './wms-tile-layer';
import { WMTSTileLayer } from './wmts-tile-layer';
import type { MapLayerRef } from './types';
import type { MapLayerConfig } from '@/types/app-config';

interface ConfiguredMapLayerProps {
  layer: MapLayerConfig;
  zIndex?: number;
  lazy?: boolean;
}

/** Renders an initiative layer using the transport declared in AppConfig. */
export const ConfiguredMapLayer = forwardRef<MapLayerRef, ConfiguredMapLayerProps>(
  ({ layer, zIndex = 2, lazy = true }, ref) => {
    const common = {
      ref,
      id: layer.id,
      url: layer.url,
      attribution: layer.attribution,
      opacity: layer.opacity ?? 0.7,
      layerType: 'overlay' as const,
      zIndex,
      lazy,
    };

    if (layer.type === 'wms') {
      return <WMSTileLayer {...common} layers={layer.layers ?? ''} />;
    }

    if (layer.type === 'wmts') {
      return <WMTSTileLayer {...common} layers={layer.layers ?? ''} />;
    }

    return <TileLayer {...common} maxNativeZoom={layer.maxNativeZoom} />;
  },
);

ConfiguredMapLayer.displayName = 'ConfiguredMapLayer';
