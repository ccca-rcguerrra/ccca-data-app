import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import * as fs from 'fs';
import * as ee from '@google/earthengine';
import { geeGetInfo } from '../../shared/utils/rxjs-utils';

@Injectable()
export class GeeService implements OnModuleInit {
  private readonly logger = new Logger(GeeService.name);
  private isInitialized = false;
  private isAuthenticated = false;
  private initPromise: Promise<void> | null = null;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    // Fire-and-forget: não bloqueia o bootstrap do Nest.
    // Qualquer chamada subsequente a init() aguarda a mesma promise.
    this.init().catch((error) => {
      this.logger.error(
        'GEE initialization failed on startup; will retry in background',
        error?.message,
      );
    });
  }

  /**
   * Background self-healing: while GEE is not ready (e.g. a transient network
   * error broke startup auth), keep retrying init so the service recovers
   * without a manual restart. No-op once ready.
   */
  @Interval('gee-reinit', Number(process.env.APP_GEE_REINIT_INTERVAL_MS) || 60000)
  async ensureInitialized(): Promise<void> {
    if (this.isReady()) return;
    try {
      await this.init();
    } catch {
      // Already logged inside doInit; the next interval tick will retry.
    }
  }

  /**
   * Initializes GEE (authentication + API init). Idempotent:
   * multiple callers share the same in-flight promise.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    if (!this.initPromise) {
      this.initPromise = this.doInit().catch((error) => {
        this.initPromise = null; // permite nova tentativa após falha
        throw error;
      });
    }

    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    const maxAttempts =
      this.configService.get<number>('gee.initMaxAttempts') ?? 5;
    const baseDelay =
      this.configService.get<number>('gee.initRetryBaseMs') ?? 2000;
    const maxDelay =
      this.configService.get<number>('gee.initRetryMaxDelayMs') ?? 30000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.log(
          `Initializing Google Earth Engine... (attempt ${attempt}/${maxAttempts})`,
        );
        await this.authenticate();
        await this.initialize();
        this.isInitialized = true;
        this.logger.log('Google Earth Engine initialized successfully');
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (attempt < maxAttempts) {
          const delay = Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
          this.logger.warn(
            `GEE init attempt ${attempt} failed (${message}); retrying in ${delay}ms`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          this.logger.error(
            `Failed to initialize Google Earth Engine after ${maxAttempts} attempts: ${message}`,
          );
          throw error;
        }
      }
    }
  }

  /**
   * Authenticate with Google Earth Engine using private key
   */
  private async authenticate(): Promise<void> {
    try {
      const credentialsSource = this.configService.get<string>('gee.googleApplicationCredentials');

      if (!credentialsSource?.trim()) {
        throw new Error('GEE credentials are not configured (APP_GEE_CREDENTIALS)');
      }

      const trimmed = credentialsSource.trim();
      let pkey: Record<string, unknown>;

      if (trimmed.startsWith('{')) {
        this.logger.log('Authenticating with GEE using inline service account JSON');
        pkey = JSON.parse(trimmed) as Record<string, unknown>;
      } else {
        if (!fs.existsSync(trimmed)) {
          throw new Error(`GEE service account file not found at: ${trimmed}`);
        }
        this.logger.log(`Authenticating with GEE using key file: ${trimmed}`);
        pkey = JSON.parse(fs.readFileSync(trimmed, 'utf-8')) as Record<string, unknown>;
      }

      await new Promise<void>((resolve, reject) => {
        ee.data.authenticateViaPrivateKey(
          pkey,
          () => {
            this.isAuthenticated = true;
            this.logger.log('GEE authentication successful');
            resolve();
          },
          (error: Error) => {
            // Log only the message — the raw error object carries the signed
            // JWT assertion (config.data.assertion) and must not reach logs.
            this.logger.error(`GEE authentication failed: ${error?.message}`);
            reject(error);
          }
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`GEE authentication error: ${message}`);
      throw error;
    }
  }

  /**
   * Initialize Google Earth Engine API
   */
  private async initialize(): Promise<void> {
    try {
      const apiUrl = this.configService.get<string>('gee.apiUrl');

      this.logger.log(`Initializing GEE API at: ${apiUrl}`);

      await new Promise<void>((resolve, reject) => {
        ee.initialize(
          apiUrl,
          null,
          () => {
            this.logger.log('GEE API initialized successfully');
            resolve();
          },
          (error: Error) => {
            this.logger.error(`GEE API initialization failed: ${error?.message}`);
            reject(error);
          }
        );
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`GEE initialization error: ${message}`);
      throw error;
    }
  }

  /**
   * Check if GEE is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.isAuthenticated;
  }

  /**
   * Get initialization status
   */
  getStatus(): {
    initialized: boolean;
    authenticated: boolean;
    ready: boolean;
  } {
    return {
      initialized: this.isInitialized,
      authenticated: this.isAuthenticated,
      ready: this.isReady(),
    };
  }

  /**
   * Returns the current Earth Engine auth header ("<token_type> <access_token>"),
   * refreshing it if none is cached. Needed to download authenticated GEE assets
   * such as getThumbURL(...):getPixels, which return 401 without it.
   */
  async getAuthToken(): Promise<string> {
    await this.init();

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
          reject(new Error('GeeService: failed to obtain access token'));
        },
        (error: Error) => {
          reject(
            new Error(
              `GeeService: failed to refresh access token: ${error?.message ?? error}`,
            ),
          );
        },
      );
    });
  }

  private readAuthHeader(): string | null {
    const token = ee.data.getAuthToken();
    return typeof token === 'string' && token.length > 0 ? token : null;
  }

  /**
   * Returns true if the GEE asset at assetId exists and is accessible.
   * Uses geeGetInfo (with timeout + retry) and treats any error as non-existent.
   */
  async assetExists(assetId: string): Promise<boolean> {
    try {
      const info = await geeGetInfo<unknown>(ee.Image(assetId));
      return !!info;
    } catch {
      return false;
    }
  }
}

