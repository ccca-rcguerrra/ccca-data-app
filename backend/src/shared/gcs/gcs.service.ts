import { Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import type { Readable } from 'stream';
import { isGeoTiffMagic } from '../utils/geotiff.util';

export type GeoTiffInvalidReason = 'missing' | 'not-geotiff' | 'error';

export interface GeoTiffValidation {
  valid: boolean;
  reason?: GeoTiffInvalidReason;
  size?: number;
  contentType?: string;
}

function buildStorageOptions(): ConstructorParameters<typeof Storage>[0] {
  const projectId = process.env.APP_GEE_PROJECT_ID;
  const credentialsRaw =
    process.env.APP_GEE_CREDENTIALS?.trim();

  if (!credentialsRaw) {
    return { projectId };
  }

  if (credentialsRaw.startsWith('{')) {
    return {
      projectId,
      credentials: JSON.parse(credentialsRaw) as Record<string, unknown>,
    };
  }

  return { projectId, keyFilename: credentialsRaw };
}

@Injectable()
export class GcsService {
  private readonly logger = new Logger(GcsService.name);
  private readonly storage: Storage;

  constructor() {
    this.storage = new Storage(buildStorageOptions());
  }

  /**
   * Returns true if the file at the given GCS URI exists.
   * URI format: gs://<bucket>/<path/to/file>
   */
  async fileExists(gcsUri: string): Promise<boolean> {
    try {
      const { bucketName, filePath } = this.parseUri(gcsUri);
      const [exists] = await this.storage
        .bucket(bucketName)
        .file(filePath)
        .exists();
      return exists;
    } catch (error) {
      this.logger.error(`fileExists error for ${gcsUri}: ${error.message}`);
      return false;
    }
  }

  /**
   * Validates that the object at the given GCS URI is a real GeoTIFF, not just
   * that it exists. Reads only the first 4 bytes (ranged read) and checks the
   * TIFF magic bytes — this catches legacy "false exports" where an HTML error
   * page (e.g. a Google 502) was uploaded with a .tif name and image/tiff type.
   * URI format: gs://<bucket>/<path/to/file>
   */
  async validateGeoTiff(gcsUri: string): Promise<GeoTiffValidation> {
    try {
      const { bucketName, filePath } = this.parseUri(gcsUri);
      const file = this.storage.bucket(bucketName).file(filePath);

      const [exists] = await file.exists();
      if (!exists) {
        return { valid: false, reason: 'missing' };
      }

      const [meta] = await file.getMetadata();
      const size = meta.size != null ? Number(meta.size) : undefined;
      const contentType = meta.contentType;

      const head = await this.readRange(file, 0, 3);
      if (!isGeoTiffMagic(head)) {
        return { valid: false, reason: 'not-geotiff', size, contentType };
      }

      return { valid: true, size, contentType };
    } catch (error) {
      this.logger.error(
        `validateGeoTiff error for ${gcsUri}: ${error.message}`,
      );
      return { valid: false, reason: 'error' };
    }
  }

  private readRange(
    file: ReturnType<ReturnType<Storage['bucket']>['file']>,
    start: number,
    end: number,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      file
        .createReadStream({ start, end })
        .on('data', (chunk: Buffer) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
  }

  /**
   * Opens a read stream for the object at the given GCS URI, for proxy-download.
   * The caller is responsible for handling stream errors (e.g. piping into an
   * Express response). URI format: gs://<bucket>/<path/to/file>
   */
  createReadStream(gcsUri: string): Readable {
    const { bucketName, filePath } = this.parseUri(gcsUri);
    return this.storage.bucket(bucketName).file(filePath).createReadStream();
  }

  /**
   * Returns the object name (last path segment) of a GCS URI.
   * e.g. gs://bucket/SENTINEL/12345/img.tif -> img.tif
   */
  objectBasename(gcsUri: string): string {
    const { filePath } = this.parseUri(gcsUri);
    return filePath.split('/').pop() || filePath;
  }

  /**
   * Downloads the object at the given GCS URI into a buffer.
   * Returns null when the object is missing or unreadable, so callers can treat a
   * cache miss and a read failure the same way (one round trip, no exists() first).
   * URI format: gs://<bucket>/<path/to/file>
   */
  async downloadBuffer(gcsUri: string): Promise<Buffer | null> {
    try {
      const { bucketName, filePath } = this.parseUri(gcsUri);
      const [buffer] = await this.storage
        .bucket(bucketName)
        .file(filePath)
        .download();
      return buffer;
    } catch (error) {
      // 404 is the expected "miss" path — only log anything unexpected.
      if (error?.code !== 404) {
        this.logger.warn(
          `downloadBuffer error for ${gcsUri}: ${error.message}`,
        );
      }
      return null;
    }
  }

  /**
   * Uploads a buffer to GCS at the given URI.
   * URI format: gs://<bucket>/<path/to/file>
   */
  async uploadBuffer(
    buffer: Buffer,
    gcsUri: string,
    contentType: string,
  ): Promise<void> {
    const { bucketName, filePath } = this.parseUri(gcsUri);
    await this.storage
      .bucket(bucketName)
      .file(filePath)
      .save(buffer, { contentType });
  }

  private parseUri(gcsUri: string): { bucketName: string; filePath: string } {
    const bucketName = gcsUri.split('/')[2];
    const filePath = gcsUri.replace(`gs://${bucketName}/`, '');
    return { bucketName, filePath };
  }
}
