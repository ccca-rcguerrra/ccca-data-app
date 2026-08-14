import { resolveApiUrl } from '@/utils/api-url';
import type {
  GeeStatus,
  SentinelImagesParams,
  SentinelPngParams,
  SentinelImagesFeatures,
  SentinelMapLayer,
  SentinelPng,
  SentinelIndexesTimeSeriesParams,
  SentinelIndexesTimeSeries,
  SentinelTimelineSummaryParams,
  SentinelTimelineSummary,
} from '@/types/gee';
import type { ApiResponse } from '@/types/api';
import { StorageService } from '@/services/storage/storage.service';
import { api } from '@/services/api';
import { STORAGE_KEY_PREFIXES } from '@/constants/storage.constants';

/**
 * Google Earth Engine service for managing GEE operations
 */
export class GeeService {
  private static readonly BASE_URL = '/api/gee';

  /**
   * Get the current status of Google Earth Engine initialization and authentication
   */
  static async getStatus(): Promise<GeeStatus> {
    const response = await api.get<ApiResponse<GeeStatus>>(`${GeeService.BASE_URL}/status`);
    return response.data.data;
  }

  /**
   * Get Sentinel-2 images as FeatureCollection filtered by date range and optional geometry
   * Each feature contains the image footprint geometry and all image properties
   */
  static async getSentinelImagesFeatures(
    params: SentinelImagesParams
  ): Promise<SentinelImagesFeatures> {
    const response = await api.post<ApiResponse<SentinelImagesFeatures>>(
      `${GeeService.BASE_URL}/images/sentinel/features`,
      params
    );
    return response.data.data;
  }

  /**
   * Get Google Earth Engine map layer data for visualizing a mosaic of Sentinel-2 images
   * filtered by date range and optional geometry
   */
  static async getSentinelMosaicMapLayer(
    params: SentinelImagesParams
  ): Promise<SentinelMapLayer> {
    const response = await api.post<ApiResponse<SentinelMapLayer>>(
      `${GeeService.BASE_URL}/images/sentinel/mosaic/maplayer`,
      params
    );
    const data = response.data.data;

    // The backend now returns a tile-proxy template (it downloads each tile from
    // GEE and relays the bytes). Resolve it against the API origin so MapLibre
    // can use it (placeholders {z}/{x}/{y} are preserved).
    if (data.urlFormat) {
      return { ...data, urlFormat: resolveApiUrl(data.urlFormat) };
    }

    return data;
  }

  /**
   * Get a square PNG image of a mosaic of Sentinel-2 images filtered by date range and optional geometry
   * The image size (width = height) can be specified in pixels
   */
  static async getSentinelMosaicPng(
    params: SentinelPngParams
  ): Promise<SentinelPng> {
    const response = await api.post<ApiResponse<SentinelPng>>(
      `${GeeService.BASE_URL}/images/sentinel/mosaic/png`,
      params
    );
    const data = response.data.data;

    // The backend now returns a path to its own PNG proxy endpoint (it downloads
    // the image from GEE and relays the bytes). Resolve it to an absolute URL
    // against the API origin so it can be used directly as an <img src>.
    if (data.url) {
      return { ...data, url: resolveApiUrl(data.url) };
    }

    return data;
  }

  /**
   * Generate a cache key from time series parameters
   */
  private static getTimeSeriesCacheKey(params: SentinelIndexesTimeSeriesParams): string {
    // Create a stable key from parameters
    const keyData = {
      startDate: params.startDate,
      endDate: params.endDate,
      indexes: params.indexes.sort().join(','),
      cloudCoverPercentage: params.cloudCoverPercentage ?? 30,
      scale: params.scale ?? 10,
      temporalResolution: params.temporalResolution ?? 'day',
      // Use a simplified geometry representation (bbox) for the key
      geometry: JSON.stringify(params.geometry),
    };
    return `${STORAGE_KEY_PREFIXES.GEE_TIMESERIES}${btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '')}`;
  }

  /** Default localStorage cache lifetime for GEE results (24h). */
  private static readonly CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;

  /**
   * Get daily time series of mean values for one or more spectral indexes calculated from Sentinel-2 images
   * Creates one data point per day by aggregating multiple images per day using median, then calculating mean values over the geometry
   * Uses cloud masking via QA60 band to filter clouds and cirrus
   * Available indexes: NDVI, NBR, NDMI
   * Days with no images or fully masked data are excluded from results
   * Results are cached in localStorage for 24 hours
   */
  static async getSentinelIndexesTimeSeries(
    params: SentinelIndexesTimeSeriesParams
  ): Promise<SentinelIndexesTimeSeries> {
    // Check cache first
    const cacheKey = GeeService.getTimeSeriesCacheKey(params);
    const cached = StorageService.getWithTtl<SentinelIndexesTimeSeries>(
      cacheKey,
      GeeService.CACHE_MAX_AGE_MS,
    );
    if (cached) {
      return cached;
    }

    // Fetch from API
    const response = await api.post<ApiResponse<SentinelIndexesTimeSeries>>(
      `${GeeService.BASE_URL}/images/sentinel/timeseries/indexes`,
      params
    );
    const data = response.data.data;

    // Save to cache
    StorageService.setWithTtl(cacheKey, data, {
      evictPrefix: STORAGE_KEY_PREFIXES.GEE_TIMESERIES,
    });

    return data;
  }

  /**
   * Generate a cache key from timeline summary parameters
   */
  private static getTimelineSummaryCacheKey(params: SentinelTimelineSummaryParams): string {
    const keyData = {
      startDate: params.startDate,
      endDate: params.endDate,
      scale: params.scale ?? 10,
      temporalResolution: params.temporalResolution ?? 'month',
      geometry: JSON.stringify(params.geometry),
    };
    return `${STORAGE_KEY_PREFIXES.GEE_TIMELINE_SUMMARY}${btoa(JSON.stringify(keyData)).replace(/[+/=]/g, '')}`;
  }

  /**
   * Get the per-period (default month) timeline summary used to drive the data
   * heatmap under the map timeline slider: mean NDVI over the AOI, mean scene
   * cloud cover (CLOUDY_PIXEL_PERCENTAGE — same property the cloud filter uses)
   * and image count. No cloud filter is applied, so the cloud value reflects the
   * real cloudiness. Results are cached in localStorage for 24 hours.
   */
  static async getSentinelTimelineSummary(
    params: SentinelTimelineSummaryParams
  ): Promise<SentinelTimelineSummary> {
    const cacheKey = GeeService.getTimelineSummaryCacheKey(params);
    const cached = StorageService.getWithTtl<SentinelTimelineSummary>(
      cacheKey,
      GeeService.CACHE_MAX_AGE_MS,
    );
    if (cached) {
      return cached;
    }

    const response = await api.post<ApiResponse<SentinelTimelineSummary>>(
      `${GeeService.BASE_URL}/images/sentinel/timeline/summary`,
      params
    );
    const data = response.data.data;

    StorageService.setWithTtl(cacheKey, data, {
      evictPrefix: STORAGE_KEY_PREFIXES.GEE_TIMELINE_SUMMARY,
    });

    return data;
  }
}

// Export individual functions for convenience
export const {
  getStatus: getGeeStatus,
  getSentinelImagesFeatures: getSentinelImagesFeatures,
  getSentinelMosaicMapLayer: getSentinelMosaicMapLayer,
  getSentinelMosaicPng: getSentinelMosaicPng,
  getSentinelIndexesTimeSeries: getSentinelIndexesTimeSeries,
  getSentinelTimelineSummary: getSentinelTimelineSummary,
} = GeeService;

// Export the service class as default
export default GeeService;

