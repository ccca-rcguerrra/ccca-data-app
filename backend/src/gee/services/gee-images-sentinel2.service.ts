import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import axios from 'axios';
import ee = require('@google/earthengine');
import type { FeatureCollection, Geometry } from 'geojson';
import { GeeService } from './gee.service';
import {
  GeeImageCollection,
  S2SrHarmonizedBand,
  S2SrHarmonizedImageProperty,
} from '../types/collections';
import { GeeImageFilterParams, SentinelVisualization } from '../types';
import { IGeeImageProvider } from './interfaces/gee-image-provider.interface';
import { resolveSentinelVisualization } from './sentinel-visualizations';
import {
  geeEvaluate,
  geeGetInfo,
  geeImageGetMap,
  geeGetThumbURL,
} from '../../shared/utils/rxjs-utils';
import { RedisService } from '../../shared/redis/redis.service';
import { REDIS_KEYS } from '../../shared/redis/redis.keys';
import { REDIS_TTL } from '../../shared/redis/redis.constants';
import { detectImageMime } from '../../shared/utils/png.util';
import { GcsService } from '../../shared/gcs/gcs.service';

/** Image bytes plus the MIME type detected from the payload's magic bytes. */
export interface ProxiedImage {
  buffer: Buffer;
  contentType: 'image/png' | 'image/jpeg';
}

/**
 * Path (relative to the backend origin) that proxies a cached GEE PNG by token.
 * Kept in sync with the GET route in GeeController — the frontend prepends its
 * API base URL to turn this into an absolute <img src>.
 */
export const SENTINEL_PNG_PROXY_PATH =
  '/api/gee/images/sentinel/mosaic/png/raw';

/**
 * Path (relative to the backend origin) that proxies a cached GEE map layer as
 * XYZ tiles by token. The `{z}/{x}/{y}` placeholders are filled by MapLibre.
 * Kept in sync with the GET route in GeeController.
 */
export const SENTINEL_MAPLAYER_PROXY_PATH =
  '/api/gee/images/sentinel/mosaic/maplayer/tiles';

/** Object prefix for the GCS tile cache (see resolveTileCacheBucket). */
const GEE_TILE_CACHE_PREFIX = 'gee-tiles/s2';

/**
 * Bucket backing the GEE tile cache, or null when the cache is off — in which case
 * the tile proxy behaves exactly as before (downloads from GEE on every request).
 *
 * Opt-in and off by default: the cache is only active when
 * APP_GEE_TILES_CACHE_ENABLED is explicitly 'true'. The bucket then
 * comes from APP_GEE_TILES_CACHE_BUCKET, falling back to the
 * bucket already used for activation image uploads.
 */
function resolveTileCacheBucket(): string | null {
  if (process.env.APP_GEE_TILES_CACHE_ENABLED?.trim() !== 'true') {
    return null;
  }

  const bucket =
    process.env.APP_GEE_TILES_CACHE_BUCKET?.trim() ||
    process.env.APP_GCS_BUCKET_NAME?.trim();

  return bucket || null;
}

@Injectable()
export class GeeImagesSentinel2Service implements IGeeImageProvider {
  private readonly logger = new Logger(GeeImagesSentinel2Service.name);

  constructor(
    private readonly geeService: GeeService,
    private readonly redis: RedisService,
    private readonly gcs: GcsService,
  ) {}

  /**
   * Build a deterministic cache key from the params that fully determine a
   * GEE result. Object keys are sorted so equivalent requests hash equally.
   */
  private cacheKey(params: Record<string, unknown>): string {
    const stable = JSON.stringify(params, (_key, value) =>
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.keys(value)
            .sort()
            .reduce(
              (acc, k) => {
                acc[k] = (value as Record<string, unknown>)[k];
                return acc;
              },
              {} as Record<string, unknown>,
            )
        : value,
    );
    return createHash('sha1').update(stable).digest('hex');
  }

  /**
   * Filter Sentinel-2 images from COPERNICUS/S2_SR_HARMONIZED collection
   * @param params - Filter parameters
   * @returns ImageCollection filtered by parameters
   */
  filter(params: GeeImageFilterParams): ee.ImageCollection {
    if (!this.geeService.isReady()) {
      throw new Error(
        'GEE is not initialized. Please wait for initialization to complete.',
      );
    }

    this.logger.log(
      `Filtering Sentinel-2 images from ${params.startDate} to ${params.endDate}`,
    );

    let collection = ee.ImageCollection(GeeImageCollection.S2SrHarmonized);

    // Filter by date range
    collection = collection.filterDate(params.startDate, params.endDate);

    // Filter by geometry if provided
    if (params.geometry) {
      collection = collection.filterBounds(params.geometry);
    }

    // Filter by cloud cover percentage if provided
    if (params.cloudCoverPercentage !== undefined) {
      collection = collection.filter(
        ee.Filter.lte(
          S2SrHarmonizedImageProperty.CloudyPixelPercentage,
          params.cloudCoverPercentage,
        ),
      );
    }

    // Limit results if specified
    if (params.maxResults) {
      collection = collection.limit(params.maxResults);
    }

    return collection;
  }

  /**
   * Build a cloud-free median composite from a filtered Sentinel-2 collection.
   *
   * Follows the GEE community recommended pipeline:
   *   - links the Cloud Score+ collection (GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED)
   *   - masks pixels whose `cs` quality score is below CLOUD_SCORE_THRESHOLD
   *   - keeps only spectral bands (B.*)
   *   - reduces to a per-band median composite
   *
   * Produces a cleaner composite than mosaic() for visualization and index
   * computation (NDVI, false colour, natural colour).
   * @param collection - Already date/bounds-filtered Sentinel-2 ImageCollection
   * @returns Median composite ee.Image
   */
  private buildCloudMaskedMedian(collection: ee.ImageCollection): ee.Image {
    const csPlus = ee.ImageCollection(GeeImageCollection.S2CloudScorePlus);
    const csBands = csPlus.first().bandNames();

    const linked = collection.linkCollection(csPlus, csBands);

    const clearThreshold = 0.6;
    const masked = linked
      .map((image: ee.Image) =>
        image.updateMask(image.select('cs').gte(clearThreshold)),
      )
      .select('B.*');

    return masked.median();
  }

  /**
   * Get Sentinel-2 image collection info
   * @param params - Filter parameters
   * @returns Collection metadata
   */
  async getCollectionInfo(params: GeeImageFilterParams): Promise<any> {
    const collection = this.filter(params);

    return geeGetInfo(collection);
  }

  /**
   * Convert GeoJSON Geometry to Earth Engine Geometry
   * @param geometry - GeoJSON Geometry
   * @returns Earth Engine Geometry
   */
  private geojsonGeometryToEeGeometry(geometry: Geometry): ee.Geometry {
    // Convert GeoJSON to ee.Geometry
    // evenOdd=false to avoid "Even/odd interiors..." error in unsupported projections
    return ee.Geometry(geometry as any, 'EPSG:4326', true, null, false);
  }

  /**
   * Extract unique dates from FeatureCollection
   * @param featureCollection - FeatureCollection with image features
   * @returns Array of unique dates in YYYY-MM-DD format
   */
  private extractUniqueDates(featureCollection: FeatureCollection): string[] {
    const datesSet = new Set<string>();

    featureCollection.features?.forEach((feature: any) => {
      let dateStr: string | null = null;

      const dateValue =
        feature.properties?.['system:time_start'] ||
        feature.properties?.DATATAKE_SENSING_START ||
        feature.properties?.SENSING_TIME ||
        feature.properties?.DATE_ACQUIRED;

      if (dateValue) {
        if (typeof dateValue === 'number') {
          dateStr = new Date(dateValue).toISOString().split('T')[0];
        } else if (typeof dateValue === 'string') {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            dateStr = date.toISOString().split('T')[0];
          } else {
            dateStr = dateValue.split('T')[0];
          }
        }
      }

      if (!dateStr && feature.id && typeof feature.id === 'string') {
        const idMatch = feature.id.match(/^(\d{4})(\d{2})(\d{2})T/);
        if (idMatch) {
          const [, year, month, day] = idMatch;
          dateStr = `${year}-${month}-${day}`;
        }
      }

      if (dateStr) {
        datesSet.add(dateStr);
      }
    });

    return Array.from(datesSet).sort();
  }

  /**
   * Find Sentinel-2 images and return as FeatureCollection with unique dates
   * Converts each image to a Feature with geometry and properties
   * @param params - Filter parameters (geometry can be GeoJSON.Geometry)
   * @returns FeatureCollection with image features and unique dates
   */
  async findImageFeatures(
    params: GeeImageFilterParams & { geometry?: Geometry },
  ): Promise<FeatureCollection & { dates: string[] }> {
    if (!this.geeService.isReady()) {
      throw new Error(
        'GEE is not initialized. Please wait for initialization to complete.',
      );
    }

    const key = REDIS_KEYS.gee.sentinelFeatures(
      this.cacheKey({
        kind: 'features',
        startDate: params.startDate,
        endDate: params.endDate,
        geometry: params.geometry ?? null,
        cloudCoverPercentage: params.cloudCoverPercentage ?? null,
        maxResults: params.maxResults ?? null,
      }),
    );

    return this.redis.getOrSet(
      key,
      async () => {
        this.logger.log(
          `Finding Sentinel-2 image features from ${params.startDate} to ${params.endDate}`,
        );

        const filterParams: GeeImageFilterParams = {
          startDate: params.startDate,
          endDate: params.endDate,
          geometry: params.geometry
            ? this.geojsonGeometryToEeGeometry(params.geometry)
            : params.geometry,
          cloudCoverPercentage: params.cloudCoverPercentage,
          maxResults: params.maxResults,
        };

        const collection = this.filter(filterParams);

        const featureCollection = collection.map((image: ee.Image) => {
          const geometry = image.geometry();
          const properties = image.toDictionary();
          return ee.Feature(geometry, properties);
        });

        const result = await geeEvaluate<FeatureCollection>(featureCollection);

        const uniqueDates = this.extractUniqueDates(result);

        return {
          ...result,
          dates: uniqueDates,
        };
      },
      REDIS_TTL.GEE_FEATURES,
    );
  }

  /**
   * Apply per-region linear stretch (p2–p98) on B4/B3/B2 bands for visualization.
   * Does NOT affect classification bands — use only after building the mosaic.
   * @param image - Sentinel-2 ee.Image
   * @param geometry - Region used to compute percentiles
   * @returns Enhanced ee.Image with stretched B4/B3/B2 bands
   */
  enhanceMosaic(image: ee.Image, geometry: ee.Geometry): ee.Image {
    /*  const bands = ['B4', 'B3', 'B2'];

        const min = image.select(bands).reduceRegion({
            reducer: ee.Reducer.percentile([2]),
            geometry,
            scale: 10,
            bestEffort: true,
            maxPixels: 1e13,
        });

        const max = image.select(bands).reduceRegion({
            reducer: ee.Reducer.percentile([98]),
            geometry,
            scale: 10,
            bestEffort: true,
            maxPixels: 1e13,
        });

        const stretched = bands.map((band) =>
            image.select(band)
                .unitScale(min.get(band), max.get(band))
                .multiply(10000)
                .round()
                .toUint16()
                .rename(band),
        );

        return image.addBands(ee.Image(stretched), null, true); */

    return image;
  }

  /**
   * Get map layer data from a pre-built Sentinel-2 mosaic.
   * Implements IGeeImageProvider — applies enhancement before getting map id.
   * @param mosaic - Pre-built ee.Image mosaic
   * @returns Map layer data with mapid, token, and urlFormat
   */
  async getMapLayer(
    mosaic: ee.Image,
  ): Promise<{ mapid: string; token: string; urlFormat: string }> {
    const enhanced = this.enhanceMosaic(mosaic, mosaic.geometry());
    const { image, visParams } = resolveSentinelVisualization(
      enhanced,
      SentinelVisualization.NaturalColor,
    );
    return geeImageGetMap(image, visParams);
  }

  /**
   * Build a Sentinel-2 median mosaic as an ee.Image (lazy — no GEE roundtrip).
   * Used by classifier services that need the raw EE object.
   * @param params - Filter parameters (geometry can be GeoJSON.Geometry)
   * @returns ee.Image (median mosaic, optionally clipped)
   */
  buildMosaic(
    params: GeeImageFilterParams & { geometry?: Geometry },
  ): ee.Image {
    if (!this.geeService.isReady()) {
      throw new Error(
        'GEE is not initialized. Please wait for initialization to complete.',
      );
    }

    const filterParams: GeeImageFilterParams = {
      startDate: params.startDate,
      endDate: params.endDate,
      geometry: params.geometry
        ? this.geojsonGeometryToEeGeometry(params.geometry)
        : params.geometry,
      cloudCoverPercentage: params.cloudCoverPercentage,
      maxResults: params.maxResults,
    };

    const collection = this.filter(filterParams);
    const mosaic = collection.mosaic();

    if (filterParams.geometry) {
      return mosaic.clip(filterParams.geometry);
    }

    return mosaic;
  }

  /**
   * Create mosaic from Sentinel-2 images and return map layer data.
   *
   * The real GEE tile template is kept in Redis under a token; the returned
   * `urlFormat` points to our own tile proxy (SENTINEL_MAPLAYER_PROXY_PATH), so
   * MapLibre fetches tiles through our backend instead of talking to GEE. The
   * GEE-side `mapid`/`token` are not exposed for the same reason.
   * @param params - Filter parameters (geometry can be GeoJSON.Geometry)
   * @returns Proxied map layer data; null when no images match filters
   */
  async getMosaicMapLayer(
    params: GeeImageFilterParams & { geometry?: Geometry },
    visualization: SentinelVisualization = SentinelVisualization.NaturalColor,
  ): Promise<{ mapid: string; token: string; urlFormat: string } | null> {
    if (!this.geeService.isReady()) {
      throw new Error(
        'GEE is not initialized. Please wait for initialization to complete.',
      );
    }

    const token = this.cacheKey({
      kind: 'maplayer',
      startDate: params.startDate,
      endDate: params.endDate,
      geometry: params.geometry ?? null,
      cloudCoverPercentage: params.cloudCoverPercentage ?? null,
      cloudMask: params.cloudMask ?? null,
      visualization,
    });
    const key = REDIS_KEYS.gee.sentinelMapLayer(token);

    let geeLayer = await this.redis.get<{
      mapid: string;
      token: string;
      urlFormat: string;
    }>(key);

    if (geeLayer === undefined) {
      // computeMosaicMapLayer returns the GEE-hosted tile template (or null).
      geeLayer =
        (await this.computeMosaicMapLayer(params, visualization)) ?? undefined;

      // Only cache positive results; absence of images may be transient.
      if (geeLayer) {
        await this.redis.set(key, geeLayer, REDIS_TTL.GEE_MAP_LAYER);
      }
    }

    if (!geeLayer) {
      return null;
    }

    // Hand the frontend our tile proxy template instead of the GEE one.
    return {
      mapid: '',
      token: '',
      urlFormat: `${SENTINEL_MAPLAYER_PROXY_PATH}/${token}/{z}/{x}/{y}`,
    };
  }

  /**
   * Resolve a map-layer proxy token + tile coordinates to the PNG tile bytes.
   *
   * Serves from the GCS tile cache when available; otherwise looks up the GEE tile
   * template cached under the token by getMosaicMapLayer(), fills in {z}/{x}/{y},
   * downloads the tile and returns the bytes plus content type (GEE serves these
   * tiles as JPEG), caching it for next time.
   *
   * A GCS hit needs neither Redis nor GEE, so cached tiles survive the Redis TTL.
   * @param token - Opaque capability token from the proxy tile URL
   * @param z - Tile zoom level
   * @param x - Tile column
   * @param y - Tile row
   * @returns Image bytes + content type, or null when the token is unknown/expired
   */
  async getMosaicTile(
    token: string,
    z: number,
    x: number,
    y: number,
  ): Promise<ProxiedImage | null> {
    const cacheUri = this.tileCacheUri(token, z, x, y);

    const cached = await this.readTileFromCache(cacheUri);
    if (cached) {
      return cached;
    }

    const geeLayer = await this.redis.get<{ urlFormat: string }>(
      REDIS_KEYS.gee.sentinelMapLayer(token),
    );

    if (!geeLayer?.urlFormat) {
      return null;
    }

    const tileUrl = geeLayer.urlFormat
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y));

    const tile = await this.downloadImageBytes(tileUrl);

    this.writeTileToCache(cacheUri, tile);

    return tile;
  }

  /**
   * GCS URI for a cached tile, or null when the cache is disabled (no bucket set).
   * The token is a deterministic hash of the mosaic params, so this path is stable
   * across Redis expirations and restarts.
   */
  private tileCacheUri(
    token: string,
    z: number,
    x: number,
    y: number,
  ): string | null {
    const bucket = resolveTileCacheBucket();
    if (!bucket) {
      return null;
    }

    return `gs://${bucket}/${GEE_TILE_CACHE_PREFIX}/${token}/${z}/${x}/${y}`;
  }

  /**
   * Read a tile from the GCS cache. Returns null on miss, on any GCS failure, or
   * when the stored object isn't a valid image — the caller then falls back to GEE,
   * so the cache can never break tile serving.
   */
  private async readTileFromCache(
    cacheUri: string | null,
  ): Promise<ProxiedImage | null> {
    if (!cacheUri) {
      return null;
    }

    const buffer = await this.gcs.downloadBuffer(cacheUri);
    if (!buffer) {
      return null;
    }

    // Guard against a corrupted/truncated object; treat it as a miss.
    const contentType = detectImageMime(buffer);
    if (!contentType) {
      this.logger.warn(
        `Cached tile is not a valid image, refetching: ${cacheUri}`,
      );
      return null;
    }

    return { buffer, contentType };
  }

  /**
   * Persist a freshly downloaded tile to the GCS cache. Fire-and-forget: the tile is
   * already on its way to the client, so a cache write must not delay or fail it.
   */
  private writeTileToCache(cacheUri: string | null, tile: ProxiedImage): void {
    if (!cacheUri) {
      return;
    }

    void this.gcs
      .uploadBuffer(tile.buffer, cacheUri, tile.contentType)
      .catch((error) =>
        this.logger.warn(`Failed to cache tile ${cacheUri}: ${error.message}`),
      );
  }

  private async computeMosaicMapLayer(
    params: GeeImageFilterParams & { geometry?: Geometry },
    visualization: SentinelVisualization,
  ): Promise<{ mapid: string; token: string; urlFormat: string } | null> {
    this.logger.log(
      `Creating Sentinel-2 mosaic map layer (${visualization}) from ${params.startDate} to ${params.endDate}`,
    );

    const filterParams: GeeImageFilterParams = {
      startDate: params.startDate,
      endDate: params.endDate,
      geometry: params.geometry
        ? this.geojsonGeometryToEeGeometry(params.geometry)
        : params.geometry,
      cloudCoverPercentage: params.cloudCoverPercentage,
      maxResults: params.maxResults,
      cloudMask: params.cloudMask,
    };

    const collection = this.filter(filterParams);

    // Check if collection has images
    const collectionSize = await geeEvaluate<number>(collection.size());

    if (collectionSize === 0) {
      this.logger.warn(
        `No Sentinel-2 images found for date range ${params.startDate} to ${params.endDate}`,
      );
      return null;
    }

    this.logger.log(`Found ${collectionSize} images in collection`);

    // Cloud-free median composite (Cloud Score+ masking) when requested; raw mosaic otherwise
    const mosaic = filterParams.cloudMask
      ? this.buildCloudMaskedMedian(collection)
      : collection.mosaic();

    // Clip to geometry if provided
    let finalImage: ee.Image = mosaic;
    if (filterParams.geometry) {
      finalImage = mosaic.clip(filterParams.geometry);
    }

    finalImage = this.enhanceMosaic(
      finalImage,
      filterParams.geometry || finalImage.geometry(),
    );

    const { image, visParams } = resolveSentinelVisualization(
      finalImage,
      visualization,
    );

    return geeImageGetMap(image, visParams);
  }

  /**
   * Create mosaic from Sentinel-2 images and return PNG URL
   * @param params - Filter parameters (geometry can be GeoJSON.Geometry)
   * @param size - Size of the PNG image in pixels (square image: width = height = size)
   * @returns Path to our own PNG proxy endpoint (SENTINEL_PNG_PROXY_PATH/:token);
   *          null when no images match filters. The GEE thumbnail URL itself is
   *          kept in Redis under the token and served by getMosaicPngBytes().
   */
  async getMosaicPng(
    params: GeeImageFilterParams & { geometry?: Geometry },
    size: number,
    visualization: SentinelVisualization = SentinelVisualization.NaturalColor,
  ): Promise<string | null> {
    if (!this.geeService.isReady()) {
      throw new Error(
        'GEE is not initialized. Please wait for initialization to complete.',
      );
    }

    const token = this.cacheKey({
      kind: 'png',
      startDate: params.startDate,
      endDate: params.endDate,
      geometry: params.geometry ?? null,
      cloudCoverPercentage: params.cloudCoverPercentage ?? null,
      cloudMask: params.cloudMask ?? null,
      visualization,
      size,
    });
    const key = REDIS_KEYS.gee.sentinelPng(token);

    let geeUrl: string | null | undefined = await this.redis.get<string>(key);
    if (geeUrl === undefined) {
      // computeMosaicPng returns the GEE-hosted thumbnail URL (or null).
      geeUrl = await this.computeMosaicPng(params, size, visualization);

      // Only cache positive results; absence of images may be transient.
      if (geeUrl) {
        await this.redis.set(key, geeUrl, REDIS_TTL.GEE_PNG);
      }
    }

    if (!geeUrl) {
      return null;
    }

    // Hand the frontend our proxy path (by token) instead of the GEE URL, so the
    // browser fetches the PNG bytes through our backend via getMosaicPngBytes().
    return `${SENTINEL_PNG_PROXY_PATH}/${token}`;
  }

  /**
   * Resolve a PNG proxy token to the actual image bytes.
   *
   * Looks up the GEE-hosted thumbnail URL cached under the token by
   * getMosaicPng(), downloads it and returns the bytes plus content type.
   * @param token - Opaque capability token from the proxy URL
   * @returns Image bytes + content type, or null when the token is unknown/expired
   */
  async getMosaicPngBytes(token: string): Promise<ProxiedImage | null> {
    const geeUrl = await this.redis.get<string>(
      REDIS_KEYS.gee.sentinelPng(token),
    );

    if (!geeUrl) {
      return null;
    }

    return this.downloadImageBytes(geeUrl);
  }

  /**
   * Download a GEE-hosted image (PNG thumbnail or JPEG map tile) and return the
   * raw bytes plus the content type detected from the payload's magic bytes.
   * Rejecting unknown payloads means we never relay a GEE/Google HTML error page.
   * @param url - Fully-resolved GEE URL to download
   * @returns Image bytes + content type
   */
  private async downloadImageBytes(url: string): Promise<ProxiedImage> {
    // GEE thumbnail URLs (:getPixels) require the Earth Engine auth header, or
    // they answer 401. Public map tiles ignore it, so we send it either way.
    const token = await this.geeService.getAuthToken();

    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer',
      // ee.data.getAuthToken() already returns "<token_type> <access_token>".
      headers: { Authorization: token },
      timeout: 60_000,
    });

    const buffer = Buffer.from(response.data);
    const contentType = detectImageMime(buffer);

    if (!contentType) {
      const preview = buffer
        .toString('utf8', 0, 200)
        .replace(/\s+/g, ' ')
        .trim();
      throw new Error(
        `GEE returned a non-image payload (${buffer.length} bytes): ${preview}`,
      );
    }

    return { buffer, contentType };
  }

  private async computeMosaicPng(
    params: GeeImageFilterParams & { geometry?: Geometry },
    size: number,
    visualization: SentinelVisualization,
  ): Promise<string | null> {
    this.logger.log(
      `Creating Sentinel-2 mosaic PNG (${size}x${size}, ${visualization}) from ${params.startDate} to ${params.endDate}`,
    );

    const filterParams: GeeImageFilterParams = {
      startDate: params.startDate,
      endDate: params.endDate,
      geometry: params.geometry
        ? this.geojsonGeometryToEeGeometry(params.geometry)
        : params.geometry,
      cloudCoverPercentage: params.cloudCoverPercentage,
      maxResults: params.maxResults,
      cloudMask: params.cloudMask,
    };

    const collection = this.filter(filterParams);

    // Check if collection has images
    const collectionSize = await geeEvaluate<number>(collection.size());

    if (collectionSize === 0) {
      this.logger.warn(
        `No Sentinel-2 images found for date range ${params.startDate} to ${params.endDate}`,
      );
      return null;
    }

    this.logger.log(`Found ${collectionSize} images in collection`);

    // Cloud-free median composite (Cloud Score+ masking) when requested; raw mosaic otherwise
    const mosaic = filterParams.cloudMask
      ? this.buildCloudMaskedMedian(collection)
      : collection.mosaic();

    // Clip to geometry if provided
    let finalImage: ee.Image = mosaic;
    if (filterParams.geometry) {
      finalImage = mosaic.clip(filterParams.geometry);
    }

    finalImage = this.enhanceMosaic(
      finalImage,
      filterParams.geometry || finalImage.geometry(),
    );

    const { image, visParams } = resolveSentinelVisualization(
      finalImage,
      visualization,
    );

    return geeGetThumbURL(image, {
      dimensions: [size, size],
      format: 'png',
      ...visParams,
    });
  }
}
