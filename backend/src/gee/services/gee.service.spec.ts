import { ConfigService } from '@nestjs/config';
import * as ee from '@google/earthengine';
import { GeeService } from './gee.service';

jest.mock('@google/earthengine', () => ({
  data: { authenticateViaPrivateKey: jest.fn() },
  initialize: jest.fn(),
}));

const mockAuth = ee.data.authenticateViaPrivateKey as jest.Mock;
const mockInitialize = ee.initialize as jest.Mock;

/** ConfigService double with inline credentials and tiny retry delays. */
function createConfig(): ConfigService {
  const values: Record<string, unknown> = {
    'gee.googleApplicationCredentials': '{"type":"service_account"}',
    'gee.apiUrl': 'https://example/api',
    'gee.initMaxAttempts': 3,
    'gee.initRetryBaseMs': 1,
    'gee.initRetryMaxDelayMs': 4,
  };
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

describe('GeeService init resilience', () => {
  let service: GeeService;

  beforeEach(() => {
    jest.clearAllMocks();
    // initialize() always succeeds (3rd positional arg is the success callback).
    mockInitialize.mockImplementation(
      (_url: string, _b: unknown, onSuccess: () => void) => onSuccess(),
    );
    service = new GeeService(createConfig());
  });

  it('recovers when authentication fails transiently then succeeds', async () => {
    let attempt = 0;
    mockAuth.mockImplementation(
      (_pkey, onSuccess: () => void, onError: (e: Error) => void) => {
        attempt++;
        if (attempt < 2) onError(new Error('Premature close'));
        else onSuccess();
      },
    );

    await service.init();

    expect(service.isReady()).toBe(true);
    expect(mockAuth).toHaveBeenCalledTimes(2);
  });

  it('rejects after exhausting all attempts', async () => {
    mockAuth.mockImplementation(
      (_pkey, _onSuccess: () => void, onError: (e: Error) => void) =>
        onError(new Error('Premature close')),
    );

    await expect(service.init()).rejects.toThrow('Premature close');
    expect(service.isReady()).toBe(false);
    expect(mockAuth).toHaveBeenCalledTimes(3); // initMaxAttempts
  });

  it('ensureInitialized retries init while not ready and is a no-op once ready', async () => {
    // First: always fail → ensureInitialized must not throw.
    mockAuth.mockImplementation(
      (_pkey, _onSuccess: () => void, onError: (e: Error) => void) =>
        onError(new Error('boom')),
    );
    await expect(service.ensureInitialized()).resolves.toBeUndefined();
    expect(service.isReady()).toBe(false);

    // Now make auth succeed and let a fresh attempt go through.
    mockAuth.mockImplementation(
      (_pkey, onSuccess: () => void) => onSuccess(),
    );
    await service.init();
    expect(service.isReady()).toBe(true);

    const callsAfterReady = mockAuth.mock.calls.length;
    await service.ensureInitialized(); // ready → no-op
    expect(mockAuth).toHaveBeenCalledTimes(callsAfterReady);
  });
});
