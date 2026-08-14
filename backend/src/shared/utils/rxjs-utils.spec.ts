import { ServiceUnavailableException } from '@nestjs/common';

// rxjs-utils reads its tuning from process.env at import time. Set small values
// BEFORE loading it so the suite runs fast with real timers.
process.env.APP_GEE_TIMEOUT_MS = '50';
process.env.APP_GEE_RETRY_COUNT = '2';
process.env.APP_GEE_RETRY_MAX_DELAY_MS = '10';
process.env.APP_GEE_MAX_CONCURRENT = '2';

/* eslint-disable @typescript-eslint/no-require-imports */
const { geeEvaluate } =
  require('./rxjs-utils') as typeof import('./rxjs-utils');
/* eslint-enable @typescript-eslint/no-require-imports */

/**
 * Fake ee object: its `evaluate(cb)` behaviour is driven by `behaviour`.
 * Returns the number of times evaluate was invoked via the shared counter.
 */
function makeEeObject(
  behaviour: (cb: (result: any, error: any) => void) => void,
) {
  let calls = 0;
  return {
    evaluate: (cb: (result: any, error: any) => void) => {
      calls++;
      behaviour(cb);
    },
    get calls() {
      return calls;
    },
  };
}

describe('wrapGeeCallback (via geeEvaluate)', () => {
  it('resolves after transient failures within the retry budget', async () => {
    let attempt = 0;
    const obj = makeEeObject((cb) => {
      attempt++;
      if (attempt < 3) {
        cb(null, new Error('transient'));
      } else {
        cb({ ok: true }, null);
      }
    });

    const result = await geeEvaluate(obj);

    expect(result).toEqual({ ok: true });
    expect(obj.calls).toBe(3); // 1 initial + 2 retries
  });

  it('throws ServiceUnavailableException when the call keeps timing out', async () => {
    // Never invokes the callback → each attempt hits the 50ms timeout.
    const obj = makeEeObject(() => {
      /* no response */
    });

    await expect(geeEvaluate(obj)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    // 1 initial + APP_GEE_RETRY_COUNT (2) retries, all timed out.
    expect(obj.calls).toBe(3);
  });

  it('propagates a non-timeout error after exhausting retries', async () => {
    const obj = makeEeObject((cb) => cb(null, new Error('boom')));

    await expect(geeEvaluate(obj)).rejects.toThrow('boom');
    expect(obj.calls).toBe(3);
  });

  it('caps concurrency at APP_GEE_MAX_CONCURRENT', async () => {
    let active = 0;
    let peak = 0;

    const makeSlowObject = () =>
      makeEeObject((cb) => {
        active++;
        peak = Math.max(peak, active);
        setTimeout(() => {
          active--;
          cb('ok', null);
        }, 30);
      });

    await Promise.all(
      Array.from({ length: 6 }, () => geeEvaluate(makeSlowObject())),
    );

    expect(peak).toBeLessThanOrEqual(2);
    expect(peak).toBeGreaterThan(0);
  });
});
