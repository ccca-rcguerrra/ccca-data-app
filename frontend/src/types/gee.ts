import type { ImageReferenceType } from './alerts';

/**
 * Google Earth Engine map layer data structure
 */
export interface GeeMapLayerData {
  reference: ImageReferenceType;
  mapid?: string;
  token?: string;
  urlFormat?: string;
}

/**
 * Google Earth Engine status structure
 */
export interface GeeStatus {
  initialized: boolean;
  authenticated: boolean;
  ready: boolean;
}

/**
 * Classification request payload
 */
export interface ClassifyActivationPayload {
  boundary: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  deforestation: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  notdeforestation: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
}

/**
 * Classification response (POST /api/activations/{id}/classify)
 */
export interface ClassifyActivationResponse {
  alertRefined: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  mapLayer?: {
    mapid?: string;
    token?: string;
    urlFormat?: string;
  };
}

/**
 * Visualization mode for the Sentinel-2 mosaic. Mirrors the backend SentinelVisualization enum.
 * Defaults to NATURAL_COLOR when omitted.
 */
export type SentinelVisualization =
  | 'NATURAL_COLOR'
  | 'FALSE_COLOR'
  | 'NDVI'
  | 'SWIR'
  | 'NDMI';

/**
 * Query parameters for Sentinel-2 images
 */
export interface SentinelImagesParams {
  startDate: string; // ISO 8601 format (YYYY-MM-DD)
  endDate: string; // ISO 8601 format (YYYY-MM-DD)
  geometry?: GeoJSON.Geometry; // Optional geometry for spatial filtering
  cloudCoverPercentage?: number; // 0-100, filters images with cloud cover less than this value
  visualization?: SentinelVisualization; // Visualization mode for the mosaic (default: NATURAL_COLOR)
  cloudMask?: boolean; // Apply Cloud Score+ masking + median composite (default: false)
}

/**
 * Query parameters for Sentinel-2 PNG images
 */
export interface SentinelPngParams extends SentinelImagesParams {
  size: number; // Size of the PNG image in pixels (square image: width = height = size), 1-4096
}

/**
 * Sentinel-2 image feature from GEE
 */
export interface SentinelImageFeature {
  type: 'Feature';
  id?: string | number; // Feature ID (e.g., "20240129T145721_20240129T145719_T19MBM")
  geometry: GeoJSON.Geometry;
  properties: Record<string, any>; // Image properties and metadata
}

/**
 * Response for Sentinel-2 images as FeatureCollection
 */
export interface SentinelImagesFeatures {
  type: 'FeatureCollection';
  features: SentinelImageFeature[];
  dates: string[]; // Array of unique dates (YYYY-MM-DD) from all images
}

/**
 * Response for Sentinel-2 map layer
 */
export interface SentinelMapLayer {
  mapid: string;
  token: string;
  urlFormat: string;
}

/**
 * Response for Sentinel-2 PNG image
 */
export interface SentinelPng {
  url?: string; // URL of the PNG image; omitted when no images match the filters
}

/**
 * Available spectral indexes for Sentinel-2 time series
 */
export type SpectralIndexType = 'NDVI' | 'NBR' | 'NDMI';

/** Temporal aggregation step for the time series (one data point per period) */
export type TemporalResolution = 'day' | 'week' | 'month';

/**
 * Query parameters for Sentinel-2 spectral indexes time series
 */
export interface SentinelIndexesTimeSeriesParams {
  startDate: string; // ISO 8601 format (YYYY-MM-DD)
  endDate: string; // ISO 8601 format (YYYY-MM-DD)
  geometry: GeoJSON.Geometry; // Required geometry for index calculation
  indexes: SpectralIndexType[]; // List of spectral indexes to calculate
  cloudCoverPercentage?: number; // 0-100, filters images with cloud cover less than or equal to this value
  scale?: number; // Scale in meters for index calculation (default: 10, range: 10-1000)
  temporalResolution?: TemporalResolution; // Aggregation step: 'day' (default), 'week' or 'month'
}

/**
 * Single point in the time series with date and mean values for requested indexes
 */
export interface IndexesTimeSeriesPoint {
  date: string; // ISO 8601 format (YYYY-MM-DD)
  values: (number | null)[]; // Mean values for the requested spectral indexes (same order as indexes parameter). Null indicates missing or invalid data
  count: number; // Number of images available on this date (after filters and masking)
}

/**
 * Response for Sentinel-2 spectral indexes time series
 */
export interface SentinelIndexesTimeSeries {
  timeSeries: IndexesTimeSeriesPoint[]; // Array of time series points with date and mean values
  count: number; // Number of points in the time series
}

/**
 * Query parameters for the Sentinel-2 timeline summary (data heatmap under the
 * map timeline slider). No cloudCoverPercentage: the goal is to SHOW cloudiness,
 * not filter it.
 */
export interface SentinelTimelineSummaryParams {
  startDate: string; // ISO 8601 format (YYYY-MM-DD)
  endDate: string; // ISO 8601 format (YYYY-MM-DD)
  geometry: GeoJSON.Geometry; // Required — prefer the tight alert polygon, not a large buffer
  scale?: number; // Scale in meters for NDVI reduction (default: 10, range: 10-1000)
  temporalResolution?: TemporalResolution; // Aggregation step (default: 'month')
}

/**
 * Single period of the timeline summary: mean NDVI over the AOI, mean scene cloud
 * cover (CLOUDY_PIXEL_PERCENTAGE — same property the cloud filter uses) and image count.
 */
export interface TimelineSummaryPoint {
  date: string; // Period start, ISO 8601 (YYYY-MM-DD)
  ndvi: number | null; // Mean NDVI over the AOI; null when there is no valid (cloud-free) data
  cloud: number | null; // Mean scene cloud cover (0-100); null when there is no image
  count: number; // Number of images available in the period
}

/**
 * Response for the Sentinel-2 timeline summary
 */
export interface SentinelTimelineSummary {
  summary: TimelineSummaryPoint[]; // Per-period points (sorted by date)
  count: number; // Number of points in the summary
}

