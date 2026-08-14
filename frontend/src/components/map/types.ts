import type { ReactNode } from 'react';
import type { Map as MapLibreMap, MapMouseEvent, MapOptions } from 'maplibre-gl';

/**
 * MapLayerRef - Interface for all map layer components
 * 
 * This interface is used by all layer components (TileLayer, WMSTileLayer, WMTSTileLayer, GeoJSONLayer)
 * to provide a consistent API for controlling layer visibility and properties.
 */
export interface MapLayerRef {
  /**
   * Set layer opacity (0-1)
   */
  setOpacity: (opacity: number) => void;
  /**
   * Get current layer opacity
   */
  getOpacity: () => number;
  /**
   * Show the layer (set opacity to 1)
   */
  show: () => void;
  /**
   * Hide the layer (set opacity to 0)
   */
  hide: () => void;
  /**
   * Check whether the layer is currently present on the map (i.e. has been
   * created via `create()` and not destroyed). Opacity is not considered.
   */
  isVisible: () => boolean;
  /**
   * Check if layer is lazy (not created automatically on mount)
   */
  isLazy: () => boolean;
  /**
   * Get layer ID
   */
  getLayerId: () => string;
  /**
   * Create the layer on the map (add source and layer)
   */
  create: () => void;
  /**
   * Destroy the layer from the map (remove layer and source)
   */
  destroy: () => void;
}

// Map Component Types
export interface MapContextValue {
  map: MapLibreMap | null;
  isMapLoaded: boolean;
}

export type MapInitOptions = Omit<
  MapOptions,
  'style' | 'container' | 'bounds' | 'fitBoundsOptions' | 'center' | 'zoom'
>;

export interface MapComponentProps extends MapInitOptions {
  center?: [number, number];
  zoom?: number;
  /** Map style URL or object. If not provided, uses default or empty per `emptyStyle`. */
  mapStyle?: MapOptions['style'];
  /** If true, initializes map with no base layers. If false, uses MAP_CONFIG default. Ignored when mapStyle is set. */
  emptyStyle?: boolean;
  className?: string;
  id?: string;
  onMapLoad?: (map: MapLibreMap) => void;
  onMapClick?: (event: MapMouseEvent) => void;
  /** Optional maplibre-gl lib or Promise; if not provided, dynamic import of 'maplibre-gl' is used. */
  mapLib?: any | Promise<any>;
  /** Callback for map initialization errors. */
  onError?: (error: Error) => void;
  /** Callback when map is destroyed. */
  onMapDestroy?: (map: MapLibreMap) => void;
  children?: ReactNode;
}

// Layer Component Types
export interface TileLayerProps {
  id?: string;
  name?: string;
  url: string;
  attribution?: string;
  opacity?: number;
  /** Maximum native tile zoom; higher zooms overzoom the last available tile. */
  maxNativeZoom?: number;
  tileSize?: number;
  subdomains?: string[];
  beforeId?: string;
  layerType?: 'base' | 'overlay';
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

export interface WMSTileLayerProps {
  id?: string;
  name?: string;
  url: string;
  layers: string;
  styles?: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  attribution?: string;
  opacity?: number;
  viewparams?: string;
  beforeId?: string;
  layerType?: 'base' | 'overlay';
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

export interface WMTSTileLayerProps {
  id?: string;
  name?: string;
  url: string;
  layers: string;
  styles?: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  tilematrixSet?: string;
  attribution?: string;
  opacity?: number;
  beforeId?: string;
  layerType?: 'base' | 'overlay';
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

export interface VectorTileLayerProps {
  id?: string;
  name?: string;
  /**
   * Tile URL template with {z}/{x}/{y} placeholders.
   * Should be absolute (starting with the API base URL) so the map
   * `transformRequest` can attach the auth token.
   */
  url: string;
  /** Name of the layer inside the vector tile (MVT `source-layer`), e.g. 'alerts'. */
  sourceLayer: string;
  /**
   * Promotes a feature property to the MapLibre feature `id`, enabling
   * `feature-state` (e.g. selection highlight) across vector tiles. Example: 'alertId'.
   */
  promoteId?: string;
  /**
   * Fill color for polygon features (default: alert base color).
   * Accepts a MapLibre data-driven expression (based on `feature-state` or a
   * feature property) in addition to a plain color string.
   */
  fillColor?: string | unknown[];
  /** Fill opacity for polygon features (plain number or zoom/data expression). */
  fillOpacity?: number | unknown[];
  /** Outline color for polygon features (plain color or expression). */
  lineColor?: string | unknown[];
  /** Outline width for polygon features (plain number or zoom/data expression). */
  lineWidth?: number | unknown[];
  /** Outline opacity for polygon features (plain number or zoom/data expression). */
  lineOpacity?: number | unknown[];
  /** Circle color for point features (plain color or expression). */
  circleColor?: string | unknown[];
  /** Circle radius for point features. */
  circleRadius?: number;
  /** Overall layer opacity (0-1) applied to fill/line/circle. */
  opacity?: number;
  /** Minimum zoom at which the source/layers are visible. */
  minzoom?: number;
  /** Maximum zoom at which the source/layers are visible. */
  maxzoom?: number;
  beforeId?: string;
  layerType?: 'base' | 'overlay';
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

export interface GeoJSONLayerProps {
  data: GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | GeoJSON.Geometry;
  id?: string;
  style?: {
    fillColor?: string;
    fillOpacity?: number;
    lineColor?: string;
    lineOpacity?: number;
    lineWidth?: number;
    lineDasharray?: number[];
  };
  fitBounds?: boolean;
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * Layer ID to insert this layer before (optional)
   */
  beforeId?: string;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

export interface ImageLayerProps {
  id?: string;
  name?: string;
  url: string;
  /**
   * Bounds for the image as [minLng, minLat, maxLng, maxLat] or GeoJSON bounds
   */
  bounds: [number, number, number, number] | GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  attribution?: string;
  opacity?: number;
  transparent?: boolean;
  beforeId?: string;
  layerType?: 'base' | 'overlay';
  /**
   * Z-index for layer ordering (higher values render on top)
   * When layer is destroyed and recreated, it will maintain its position based on zIndex
   */
  zIndex?: number;
  /**
   * If true, layer will not be created automatically on mount
   * Layer must be created manually via ref.create() after user interaction
   * Default: false (layer is created immediately)
   */
  lazy?: boolean;
}

// Drawing Controls Types
export interface DrawingControlsProps {
  /**
   * Callback when a feature is created
   */
  onFeatureCreate?: (feature: GeoJSON.Feature) => void;
  /**
   * Callback when a feature is updated
   */
  onFeatureUpdate?: (feature: GeoJSON.Feature) => void;
  /**
   * Callback when a feature is deleted
   */
  onFeatureDelete?: () => void;
  /**
   * Callback when geometries change (create, update, delete)
   * Returns all current geometries in the draw control
   */
  onGeometriesChange?: (geometries: GeoJSON.FeatureCollection) => void;
  /**
   * Default drawing mode
   */
  defaultMode?: 'draw_polygon' | 'draw_rectangle' | 'draw_circle' | 'simple_select' | 'direct_select';
  /**
   * Target geometry to draw/edit (from API, for example)
   */
  drawTarget?: GeoJSON.FeatureCollection;
  /**
   * Trigger to clear all geometries (increment this value to clear)
   */
  clearTrigger?: number;
  /**
   * Enable/disable editing mode
   */
  editMode?: boolean;
  /**
   * Enable/disable drawing controls visibility
   * When false, the MapboxDraw UI controls are hidden
   */
  enabled?: boolean;
  /**
   * Keep drawing mode active after creating a feature
   */
  continuousDraw?: boolean;
  /**
   * Maximum number of features allowed in the draw canvas at once.
   * When a new feature is created and the limit is exceeded, the oldest features
   * are removed silently before any callback fires. Set to 1 for single-geometry tools (e.g. envelope).
   */
  maxFeatures?: number;
}

export interface DrawingControlsRef {
  /**
   * Set a geometry to edit
   */
  setGeometry: (geometry: GeoJSON.FeatureCollection) => void;
  /**
   * Clear all geometries from the map
   */
  clearGeometry: () => void;
  /**
   * Get all current geometries
   */
  getGeometry: () => GeoJSON.FeatureCollection;
  /**
   * Change drawing mode
   */
  changeMode: (mode: 'draw_polygon' | 'draw_rectangle' | 'draw_circle' | 'simple_select' | 'direct_select') => void;
  /**
   * Finalize the active draw mode (discard incomplete placeholder features)
   * before reading the geometry on exit.
   */
  finalizeDrawing: () => void;
}

// Marker Types
export interface MarkerProps {
  position: [number, number];
  color?: string;
  size?: number;
  onClick?: () => void;
}

// Layers Control Types
export interface LayerInfo {
  id: string;
  name: string;
  type: 'base' | 'overlay';
  layerRef?: React.RefObject<MapLayerRef | null>;
  selected?: boolean;
  lazy?: boolean;
}

export interface LayersControlProps {
  children: ReactNode;
  showControlPanel?: boolean;
  controlPanelPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface LayerControlItemProps {
  /**
   * Reference to the layer component (MapLayerRef)
   */
  layerRef: React.RefObject<MapLayerRef | null>;
  /**
   * Unique identifier for the layer
   */
  id: string;
  /**
   * Display name for the layer
   */
  name: string;
  /**
   * Type of layer: 'base' for base maps (only one active), 'overlay' for overlays (multiple can be active)
   */
  layerType: 'base' | 'overlay';
  /**
   * Initial selected state (for base maps) or visible state (for overlays)
   * For base maps: only one should be selected=true
   * For overlays: multiple can be selected=true
   * If not specified and lazy=false, will be automatically set to true
   */
  selected?: boolean;
  /**
   * If true, layer will not be created automatically on mount
   * Layers with lazy=false will be automatically selected on init if selected is not specified
   */
  lazy?: boolean;
  /**
   * Optional index for ordering (not used in current implementation)
   */
  index?: number;
  /**
   * Children components (the actual layer component)
   */
  children?: ReactNode;
}

// Utils Types
export type GeoJSONLike = GeoJSON.Feature<GeoJSON.Geometry> | GeoJSON.FeatureCollection<GeoJSON.Geometry> | GeoJSON.Geometry;
