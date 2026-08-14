import { Injectable, Logger } from '@nestjs/common';
import ee = require('@google/earthengine');
import * as turf from '@turf/turf';
import type { Polygon, Geometry } from 'geojson';
import axios from 'axios';
import { GeeService } from './gee.service';
import { geeGetInfo } from '../../shared/utils/rxjs-utils';
import { isGeoTiffMagic } from '../../shared/utils/geotiff.util';
import { getExportCrs } from '../../model/geo.constants';

const COMPUTE_PIXELS_URL =
  'https://earthengine.googleapis.com/v1beta/projects/earthengine-public/image:computePixels';

export const SQUARE_BUFFER_METERS = 500;
export const SENTINEL_EXPORT_BANDS = ['B4', 'B3', 'B2'];
export const SENTINEL_EXPORT_PIXEL_SIZE_M = 10;
export const PLANET_EXPORT_BANDS = ['R', 'G', 'B'];
export const PLANET_EXPORT_PIXEL_SIZE_M = 4;

/** Number of attempts for the computePixels download (transient GEE/GFE 5xx). */
const COMPUTE_PIXELS_MAX_ATTEMPTS = 3;
/** Base backoff (ms) between download attempts; grows linearly per attempt. */
const COMPUTE_PIXELS_RETRY_BASE_MS = 1_500;

@Injectable()
export class GeeComputePixelsService {
  private readonly logger = new Logger(GeeComputePixelsService.name);

  constructor(private readonly geeService: GeeService) {}

  /**
   * Builds a square bounding box around the given geometry, expanded by bufferMeters on each side.
   *
   * Mirrors the Python v1 shapely_utils.square_buffer logic:
   *   1. compute bbox of the geometry
   *   2. find centroid of that bbox
   *   3. radius = max(width, height) / 2 + bufferMeters
   *   4. circle-buffer the centroid by that radius
   *   5. take the envelope (making it square)
   */
  buildSquareBuffer(geometry: Geometry, bufferMeters: number): Polygon {
    const feature = turf.feature(geometry as any);
    const [minX, minY, maxX, maxY] = turf.bbox(feature);

    const widthM = turf.distance([minX, minY], [maxX, minY], { units: 'meters' });
    const heightM = turf.distance([minX, minY], [minX, maxY], { units: 'meters' });

    const radiusKm = (Math.max(widthM, heightM) / 2 + bufferMeters) / 1_000;

    const centroid = turf.centroid(feature);
    const circle = turf.buffer(centroid, radiusKm, { units: 'kilometers' });
    const envelope = turf.envelope(circle!);

    return envelope.geometry;
  }

  /**
   * Downloads a GEE image as a GeoTIFF via the computePixels REST API.
   *
   * Equivalent to the Python v1 download_gee_image():
   *   - bands, pixelSizeM and crsCode can be customised per origin
   *   - scale and bbox are derived via GEE (atScale + geometry.bounds), matching Python v1
   *   - returns the raw bytes of the GeoTIFF
   */
  async downloadAsGeoTiff(
    eeImage: ee.Image,
    squareBuffer: Polygon,
    bands: string[],
    pixelSizeM = SENTINEL_EXPORT_PIXEL_SIZE_M,
    crsCode = getExportCrs(),
  ): Promise<Buffer> {
    const token = await this.getAccessToken();

    const [{ scaleX, scaleY }, { xMin, xMax, yMin, yMax }] = await Promise.all([
      this.getExportAffineScales(pixelSizeM),
      this.getExportBbox(squareBuffer),
    ]);

    const width = Math.ceil((xMax - xMin) / scaleX);
    const height = Math.ceil((yMax - yMin) / -scaleY);

    // computePixels expects the Cloud API expression format (matches Python's ee.serializer.encode),
    // not the legacy { type, scope, value } returned by ee.Serializer.encode in the JS client.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const expression = (ee as any).Serializer.encodeCloudApi(eeImage);

    const body = {
      expression,
      fileFormat: 'GEO_TIFF',
      bandIds: bands,
      grid: {
        dimensions: { width, height },
        affineTransform: {
          scaleX,
          scaleY,
          shearX: 0,
          shearY: 0,
          translateX: xMin,
          translateY: yMax,
        },
        crsCode,
      },
      visualizationOptions: { ranges: [{ min: 0, max: 3000 }] },
    };

    this.logger.log(
      `computePixels: bands=${bands.join(',')} size=${width}x${height} crs=${crsCode}`,
    );

    return this.postComputePixels(body, token);
  }

  /**
   * POSTs to computePixels and returns the GeoTIFF bytes, retrying transient
   * failures. The GEE / Google Frontend occasionally answers with an HTML error
   * body (e.g. a 502 page) even on a 2xx status, so we validate that the payload
   * is a real GeoTIFF before returning it — never upload/persist that garbage.
   */
  private async postComputePixels(body: unknown, token: string): Promise<Buffer> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= COMPUTE_PIXELS_MAX_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post<ArrayBuffer>(COMPUTE_PIXELS_URL, body, {
          headers: {
            // ee.data.getAuthToken() already returns "<token_type> <access_token>"
            Authorization: token,
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer',
          timeout: 120_000,
        });

        const buffer = Buffer.from(response.data);
        const contentType = String(response.headers['content-type'] ?? '');

        if (!isGeoTiffMagic(buffer)) {
          const preview = buffer.toString('utf8', 0, 200).replace(/\s+/g, ' ').trim();
          throw new Error(
            `computePixels returned a non-GeoTIFF payload (content-type=${contentType}, ` +
              `${buffer.length} bytes): ${preview}`,
          );
        }

        return buffer;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn(
          `computePixels attempt ${attempt}/${COMPUTE_PIXELS_MAX_ATTEMPTS} failed: ${lastError.message}`,
        );

        if (attempt < COMPUTE_PIXELS_MAX_ATTEMPTS) {
          await this.delay(COMPUTE_PIXELS_RETRY_BASE_MS * attempt);
        }
      }
    }

    throw lastError ?? new Error('computePixels: download failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Pixel scale in degrees from GEE (matches Python v1 ee.Projection('EPSG:4326').atScale).
   */
  private async getExportAffineScales(
    pixelSizeM: number,
  ): Promise<{ scaleX: number; scaleY: number }> {
    await this.geeService.init();

    const proj = await geeGetInfo<{ transform: number[] }>(
      ee.Projection('EPSG:4326').atScale(pixelSizeM),
    );

    const transform = proj?.transform;
    if (!transform || transform.length < 5) {
      throw new Error('GeeComputePixelsService: invalid projection transform from GEE');
    }

    return {
      scaleY: -transform[0],
      scaleX: transform[4],
    };
  }

  /**
   * Bounding box from GEE geometry bounds (matches Python v1 download_gee_image).
   */
  private async getExportBbox(
    geometry: Polygon,
  ): Promise<{ xMin: number; yMin: number; xMax: number; yMax: number }> {
    await this.geeService.init();

    const geeGeom = ee.Geometry(geometry as any);
    const bbox = geeGeom.bounds();
    const listCoords = await geeGetInfo<number[][]>(ee.Array.cat(bbox.coordinates(), 1));

    return {
      xMin: listCoords[0][0],
      xMax: listCoords[1][0],
      yMin: listCoords[0][1],
      yMax: listCoords[2][1],
    };
  }

  /**
   * Reuses the Earth Engine client session from GeeService (authenticateViaPrivateKey),
   * matching Python v1 where GeeInitialize and GeeSession share the same GEE key.
   */
  private readAuthHeader(): string | null {
    const token = ee.data.getAuthToken();
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  private async getAccessToken(): Promise<string> {
    await this.geeService.init();

    const cached = this.readAuthHeader();
    if (cached) {
      return cached;
    }

    return new Promise<string>((resolve, reject) => {
      ee.data.refreshAuthToken(
        () => {
          const token = this.readAuthHeader();
          if (token) {
            resolve(token);
            return;
          }
          reject(new Error('GeeComputePixelsService: failed to obtain access token'));
        },
        (error: Error) => {
          reject(
            new Error(
              `GeeComputePixelsService: failed to refresh access token: ${error?.message ?? error}`,
            ),
          );
        },
      );
    });
  }
}
