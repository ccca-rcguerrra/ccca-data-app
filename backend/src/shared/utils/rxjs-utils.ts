import { ServiceUnavailableException } from '@nestjs/common';
import { lastValueFrom, Observable, timer, TimeoutError } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';
import pLimit from 'p-limit';

const APP_GEE_TIMEOUT_MS = Number(process.env.APP_GEE_TIMEOUT_MS) || 30000;
const APP_GEE_RETRY_COUNT = Number(process.env.APP_GEE_RETRY_COUNT) || 3;
const APP_GEE_RETRY_MAX_DELAY_MS =
  Number(process.env.APP_GEE_RETRY_MAX_DELAY_MS) || 8000;
const APP_GEE_MAX_CONCURRENT = Number(process.env.APP_GEE_MAX_CONCURRENT) || 30;

/**
 * Caps concurrent calls to the shared GEE session. Bursts queue in memory
 * instead of overwhelming the session and triggering cascading timeouts.
 */
const geeLimit = pLimit(APP_GEE_MAX_CONCURRENT);

const wrapGeeCallback = <T>(
  fn: (cb: (result: T, error: any) => void) => void,
): Promise<T> =>
  geeLimit(() => {
    const stream = new Observable<T>((subscriber) => {
      fn((result, error) => {
        if (error) {
          subscriber.error(error);
          return;
        }
        subscriber.next(result);
        subscriber.complete();
      });
    }).pipe(
      timeout({ each: APP_GEE_TIMEOUT_MS }),
      // Exponential backoff (2s, 4s, 8s…) so a saturated GEE session gets time
      // to recover instead of being immediately re-hammered by retries.
      retry({
        count: APP_GEE_RETRY_COUNT,
        delay: (_error, retryCount) =>
          timer(Math.min(1000 * 2 ** retryCount, APP_GEE_RETRY_MAX_DELAY_MS)),
      }),
    );

    return lastValueFrom(stream).catch((error) => {
      if (error instanceof TimeoutError) {
        throw new ServiceUnavailableException(
          'Google Earth Engine did not respond in time. Please try again shortly.',
        );
      }
      throw error;
    });
  });

export const geeImageGetMapId = <T = { mapid: string; token: string }>(
  eeImage: any,
  visParams: any,
): Promise<T> => wrapGeeCallback<T>((cb) => eeImage.getMapId(visParams, cb));

export const geeImageGetMap = (
  eeImage: any,
  visParams: any,
): Promise<{ mapid: string; token: string; urlFormat: string }> =>
  wrapGeeCallback<{ mapid: string; token: string; urlFormat: string }>((cb) =>
    eeImage.getMap(visParams, cb),
  );

export const geeEvaluate = <T>(eeObject: any): Promise<T> =>
  wrapGeeCallback<T>((cb) => eeObject.evaluate(cb));

export const geeGetInfo = <T>(eeObject: any): Promise<T> =>
  wrapGeeCallback<T>((cb) => eeObject.getInfo(cb));

export const geeGetThumbURL = (eeImage: any, params: any): Promise<string> =>
  wrapGeeCallback<string>((cb) => eeImage.getThumbURL(params, cb));
