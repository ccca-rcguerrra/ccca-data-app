import type { Geometry } from 'geojson';
import axios from 'axios';
import { GeeImagesSentinel2Service } from './gee-images-sentinel2.service';
import { SentinelVisualization } from '../types';
import {
  geeEvaluate,
  geeImageGetMap,
  geeGetThumbURL,
} from '../../shared/utils/rxjs-utils';

jest.mock('axios');
const mockAxiosGet = (axios as jest.Mocked<typeof axios>).get;

/** Minimal valid PNG payload (8-byte signature) for magic-byte validation. */
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
/** Minimal valid JPEG payload (SOI + APP0 marker) — GEE serves tiles as JPEG. */
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

// Earth Engine SDK: self-returning chainable proxy so any ee.* call is a no-op.
// The methods under test never inspect the ee objects directly — the actual
// roundtrips (geeEvaluate / geeImageGetMap / geeGetThumbURL) are mocked below.
jest.mock('@google/earthengine', () => {
  const handler: ProxyHandler<any> = {
    get: () => proxy,
    apply: () => proxy,
  };
  const proxy: any = new Proxy(function () {}, handler);
  return proxy;
});

// Mock the GEE roundtrip helpers — we assert how often they are invoked.
jest.mock('../../shared/utils/rxjs-utils', () => ({
  geeEvaluate: jest.fn(),
  geeImageGetMap: jest.fn(),
  geeGetThumbURL: jest.fn(),
  geeGetInfo: jest.fn(),
}));

const mockEvaluate = geeEvaluate as jest.Mock;
const mockGetMap = geeImageGetMap as jest.Mock;
const mockGetThumb = geeGetThumbURL as jest.Mock;

/** In-memory RedisService double mirroring get/set/getOrSet semantics. */
function createRedisFake() {
  const store = new Map<string, unknown>();
  return {
    store,
    get: jest.fn(async (key: string) =>
      store.has(key) ? store.get(key) : undefined,
    ),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    getOrSet: jest.fn(async (key: string, factory: () => Promise<unknown>) => {
      if (store.has(key)) return store.get(key);
      const value = await factory();
      store.set(key, value);
      return value;
    }),
  };
}

/** GcsService double — the tile cache is disabled by default in tests (no bucket env). */
function createGcsFake() {
  return {
    downloadBuffer: jest.fn(async () => null),
    uploadBuffer: jest.fn(async () => undefined),
  };
}

describe('GeeImagesSentinel2Service (cache)', () => {
  let service: GeeImagesSentinel2Service;
  let redis: ReturnType<typeof createRedisFake>;
  let gcs: ReturnType<typeof createGcsFake>;

  const geeService = {
    isReady: () => true,
    getAuthToken: jest.fn().mockResolvedValue('Bearer test-token'),
  } as any;

  const baseParams = {
    startDate: '2025-01-01',
    endDate: '2025-01-31',
    geometry: { type: 'Point', coordinates: [0, 0] } as Geometry,
    cloudCoverPercentage: 20,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redis = createRedisFake();
    gcs = createGcsFake();
    service = new GeeImagesSentinel2Service(
      geeService,
      redis as any,
      gcs as any,
    );
  });

  describe('findImageFeatures', () => {
    beforeEach(() => {
      mockEvaluate.mockResolvedValue({
        type: 'FeatureCollection',
        features: [],
      });
    });

    it('computes once and serves the second identical call from cache', async () => {
      await service.findImageFeatures(baseParams);
      await service.findImageFeatures(baseParams);

      expect(mockEvaluate).toHaveBeenCalledTimes(1);
    });

    it('recomputes when params differ', async () => {
      await service.findImageFeatures(baseParams);
      await service.findImageFeatures({ ...baseParams, endDate: '2025-02-28' });

      expect(mockEvaluate).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMosaicMapLayer', () => {
    const layer = { mapid: 'm', token: 't', urlFormat: 'u' };

    beforeEach(() => {
      mockEvaluate.mockResolvedValue(5); // collection size
      mockGetMap.mockResolvedValue(layer);
    });

    it('caches a positive result (getMap called once for two identical calls)', async () => {
      const first = await service.getMosaicMapLayer(baseParams);
      const second = await service.getMosaicMapLayer(baseParams);

      expect(first).toEqual(second);
      expect(mockGetMap).toHaveBeenCalledTimes(1);
    });

    it('returns our own tile-proxy template (not the GEE one) and hides mapid/token', async () => {
      const result = await service.getMosaicMapLayer(baseParams);

      expect(result).toMatchObject({ mapid: '', token: '' });
      expect(result!.urlFormat).toMatch(
        /^\/api\/gee\/images\/sentinel\/mosaic\/maplayer\/tiles\/[a-f0-9]{40}\/\{z\}\/\{x\}\/\{y\}$/,
      );

      // The real GEE layer stays cached under the token the proxy points to.
      const token = result!.urlFormat.split('/')[8];
      expect(redis.store.get(`gee:s2:maplayer:${token}`)).toEqual(layer);
    });

    it('does NOT cache a null result (no images) and recomputes next time', async () => {
      mockEvaluate.mockResolvedValue(0); // empty collection

      const first = await service.getMosaicMapLayer(baseParams);
      const second = await service.getMosaicMapLayer(baseParams);

      expect(first).toBeNull();
      expect(second).toBeNull();
      expect(redis.set).not.toHaveBeenCalled();
      expect(mockEvaluate).toHaveBeenCalledTimes(2); // recomputed, not cached
    });

    it('builds a stable cache key regardless of geometry key order', async () => {
      await service.getMosaicMapLayer({
        ...baseParams,
        geometry: { type: 'Point', coordinates: [0, 0] },
      });
      // Same geometry, keys declared in a different order → must hit cache.
      await service.getMosaicMapLayer({
        ...baseParams,
        geometry: { coordinates: [0, 0], type: 'Point' } as any,
      });

      expect(mockGetMap).toHaveBeenCalledTimes(1);
    });

    it('separates cache by visualization mode', async () => {
      await service.getMosaicMapLayer(
        baseParams,
        SentinelVisualization.NaturalColor,
      );
      await service.getMosaicMapLayer(
        baseParams,
        SentinelVisualization.FalseColor,
      );

      expect(mockGetMap).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMosaicPng', () => {
    beforeEach(() => {
      mockEvaluate.mockResolvedValue(5);
      mockGetThumb.mockResolvedValue('https://example/thumb.png');
    });

    it('caches the PNG url (thumb called once for two identical calls)', async () => {
      await service.getMosaicPng(baseParams, 512);
      await service.getMosaicPng(baseParams, 512);

      expect(mockGetThumb).toHaveBeenCalledTimes(1);
    });

    it('separates cache by size', async () => {
      await service.getMosaicPng(baseParams, 512);
      await service.getMosaicPng(baseParams, 256);

      expect(mockGetThumb).toHaveBeenCalledTimes(2);
    });

    it('returns our own proxy path (not the GEE url) carrying the cache token', async () => {
      const result = await service.getMosaicPng(baseParams, 512);

      expect(result).toMatch(
        /^\/api\/gee\/images\/sentinel\/mosaic\/png\/raw\/[a-f0-9]{40}$/,
      );
      expect(result).not.toContain('https://example/thumb.png');

      // The GEE url stays cached under the token the proxy path points to.
      const token = result!.split('/').pop()!;
      expect(redis.store.get(`gee:s2:png:${token}`)).toBe(
        'https://example/thumb.png',
      );
    });

    it('returns null (no throw) and does NOT cache when there are no images', async () => {
      mockEvaluate.mockResolvedValue(0);

      const first = await service.getMosaicPng(baseParams, 512);
      const second = await service.getMosaicPng(baseParams, 512);

      expect(first).toBeNull();
      expect(second).toBeNull();
      expect(redis.set).not.toHaveBeenCalled();
      expect(mockEvaluate).toHaveBeenCalledTimes(2); // recomputed, not cached
    });
  });

  describe('getMosaicPngBytes', () => {
    beforeEach(() => {
      mockEvaluate.mockResolvedValue(5);
      mockGetThumb.mockResolvedValue('https://example/thumb.png');
    });

    it('returns null for an unknown/expired token (no download attempted)', async () => {
      const bytes = await service.getMosaicPngBytes('deadbeef');

      expect(bytes).toBeNull();
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });

    it('downloads the cached GEE url and returns the PNG bytes + content type', async () => {
      mockAxiosGet.mockResolvedValue({ data: PNG_BYTES });

      const path = await service.getMosaicPng(baseParams, 512);
      const token = path!.split('/').pop()!;

      const image = await service.getMosaicPngBytes(token);

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://example/thumb.png',
        expect.objectContaining({
          responseType: 'arraybuffer',
          // GEE :getPixels URLs 401 without the Earth Engine auth header.
          headers: { Authorization: 'Bearer test-token' },
        }),
      );
      expect(image).toEqual({ buffer: PNG_BYTES, contentType: 'image/png' });
    });

    it('throws when GEE returns a non-image payload (e.g. an HTML error page)', async () => {
      mockAxiosGet.mockResolvedValue({ data: Buffer.from('<html>502</html>') });

      const path = await service.getMosaicPng(baseParams, 512);
      const token = path!.split('/').pop()!;

      await expect(service.getMosaicPngBytes(token)).rejects.toThrow(
        /non-image payload/,
      );
    });
  });

  describe('getMosaicTile', () => {
    // GEE tile template with the standard {z}/{x}/{y} placeholders.
    const layer = {
      mapid: 'm',
      token: 't',
      urlFormat: 'https://gee/tiles/{z}/{x}/{y}',
    };

    beforeEach(() => {
      mockEvaluate.mockResolvedValue(5);
      mockGetMap.mockResolvedValue(layer);
    });

    it('returns null for an unknown/expired token (no download attempted)', async () => {
      const bytes = await service.getMosaicTile('deadbeef', 12, 2045, 2812);

      expect(bytes).toBeNull();
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });

    it('fills {z}/{x}/{y}, downloads the tile and returns the JPEG bytes + content type', async () => {
      // GEE serves map tiles as JPEG (not PNG like the thumbnails).
      mockAxiosGet.mockResolvedValue({ data: JPEG_BYTES });

      const result = await service.getMosaicMapLayer(baseParams);
      const token = result!.urlFormat.split('/')[8];

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(mockAxiosGet).toHaveBeenCalledWith(
        'https://gee/tiles/12/2045/2812',
        expect.objectContaining({ responseType: 'arraybuffer' }),
      );
      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
    });

    it('does not touch GCS when no cache bucket is configured', async () => {
      mockAxiosGet.mockResolvedValue({ data: JPEG_BYTES });

      const result = await service.getMosaicMapLayer(baseParams);
      const token = result!.urlFormat.split('/')[8];
      await service.getMosaicTile(token, 12, 2045, 2812);

      expect(gcs.downloadBuffer).not.toHaveBeenCalled();
      expect(gcs.uploadBuffer).not.toHaveBeenCalled();
    });
  });

  describe('getMosaicTile (GCS cache)', () => {
    const layer = {
      mapid: 'm',
      token: 't',
      urlFormat: 'https://gee/tiles/{z}/{x}/{y}',
    };

    /** Mints a real proxy token (and caches the GEE layer in Redis under it). */
    async function mintToken(): Promise<string> {
      const result = await service.getMosaicMapLayer(baseParams);
      return result!.urlFormat.split('/')[8];
    }

    const cacheUriFor = (token: string) =>
      `gs://test-bucket/gee-tiles/s2/${token}/12/2045/2812`;

    beforeEach(() => {
      process.env.APP_GEE_TILES_CACHE_ENABLED = 'true';
      process.env.APP_GEE_TILES_CACHE_BUCKET = 'test-bucket';
      mockEvaluate.mockResolvedValue(5);
      mockGetMap.mockResolvedValue(layer);
      mockAxiosGet.mockResolvedValue({ data: JPEG_BYTES });
    });

    afterEach(() => {
      delete process.env.APP_GEE_TILES_CACHE_ENABLED;
      delete process.env.APP_GEE_TILES_CACHE_BUCKET;
    });

    it('stays disabled when the bucket is set but ENABLED is not "true"', async () => {
      process.env.APP_GEE_TILES_CACHE_ENABLED = 'false';
      const token = await mintToken();

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
      expect(gcs.downloadBuffer).not.toHaveBeenCalled();
      expect(gcs.uploadBuffer).not.toHaveBeenCalled();
    });

    it('on a miss, downloads from GEE and caches the tile under the token path', async () => {
      const token = await mintToken();

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
      expect(gcs.downloadBuffer).toHaveBeenCalledWith(cacheUriFor(token));
      expect(gcs.uploadBuffer).toHaveBeenCalledWith(
        JPEG_BYTES,
        cacheUriFor(token),
        'image/jpeg',
      );
    });

    it('on a hit, serves from GCS without downloading from GEE', async () => {
      gcs.downloadBuffer.mockResolvedValue(JPEG_BYTES as any);
      const token = await mintToken();
      mockAxiosGet.mockClear();

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
      expect(mockAxiosGet).not.toHaveBeenCalled();
      expect(gcs.uploadBuffer).not.toHaveBeenCalled();
    });

    it('serves a cached tile even after the Redis token expired (no 404)', async () => {
      gcs.downloadBuffer.mockResolvedValue(JPEG_BYTES as any);
      const token = await mintToken();
      redis.store.clear(); // GEE tile template gone — today this would 404

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
      expect(mockAxiosGet).not.toHaveBeenCalled();
    });

    it('treats a corrupted cached object as a miss and refetches from GEE', async () => {
      gcs.downloadBuffer.mockResolvedValue(Buffer.from('<html>502</html>') as any);
      const token = await mintToken();

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
      expect(mockAxiosGet).toHaveBeenCalled();
    });

    it('still serves the tile when caching it fails', async () => {
      gcs.uploadBuffer.mockRejectedValue(new Error('bucket unavailable') as never);
      const token = await mintToken();

      const tile = await service.getMosaicTile(token, 12, 2045, 2812);

      expect(tile).toEqual({ buffer: JPEG_BYTES, contentType: 'image/jpeg' });
    });
  });
});
