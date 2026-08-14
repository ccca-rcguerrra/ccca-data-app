import { registerAs } from '@nestjs/config';

export default registerAs('gee', () => ({
  googleApplicationCredentials:
    process.env.APP_GEE_CREDENTIALS,
  apiUrl:
    process.env.APP_GEE_API_URL || 'https://earthengine-highvolume.googleapis.com',
  planetCollection: process.env.APP_GEE_PLANET_COLLECTION,
  // Resilience tuning for GEE calls (consumed by shared/utils/rxjs-utils.ts).
  timeoutMs: Number(process.env.APP_GEE_TIMEOUT_MS) || 30000,
  retryCount: Number(process.env.APP_GEE_RETRY_COUNT) || 3,
  retryMaxDelayMs: Number(process.env.APP_GEE_RETRY_MAX_DELAY_MS) || 8000,
  maxConcurrent: Number(process.env.APP_GEE_MAX_CONCURRENT) || 4,
  // Resilience tuning for startup auth/init (consumed by gee.service.ts).
  initMaxAttempts: Number(process.env.APP_GEE_INIT_MAX_ATTEMPTS) || 5,
  initRetryBaseMs: Number(process.env.APP_GEE_INIT_RETRY_BASE_MS) || 2000,
  initRetryMaxDelayMs: Number(process.env.APP_GEE_INIT_RETRY_MAX_DELAY_MS) || 30000,
  // How often to retry init in the background while GEE is not ready.
  reinitIntervalMs: Number(process.env.APP_GEE_REINIT_INTERVAL_MS) || 60000,
}));
