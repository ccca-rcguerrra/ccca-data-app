import { createJSONStorage, type PersistStorage, type StateStorage } from 'zustand/middleware';

export interface EvictionOptions {
  /** When quota is exceeded, evict oldest entries sharing this prefix. */
  evictPrefix?: string;
  /** Evict only when the prefix already has at least this many keys. Defaults to 50. */
  evictWhenAbove?: number;
  /** How many oldest entries to remove when evicting. Defaults to 10. */
  evictCount?: number;
}

interface TtlEnvelope<T> {
  data: T;
  timestamp: number;
}

/**
 * Centralised localStorage access for the application.
 *
 * Keys are expected to already include the app namespace (see STORAGE_KEYS).
 * This service never prefixes keys on its own, to avoid double-namespacing.
 *
 * Zustand persist stores should use {@link StorageService.createPersistStorage}
 * as their storage driver; they keep owning state, partialize, merge and migrate.
 */
export class StorageService {
  private static availability: boolean | null = null;

  /** False when storage is blocked (private mode, disabled cookies, SSR). */
  static isAvailable(): boolean {
    if (StorageService.availability !== null) {
      return StorageService.availability;
    }

    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        StorageService.availability = false;
        return false;
      }

      const probe = '__storage_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      StorageService.availability = true;
      return true;
    } catch {
      StorageService.availability = false;
      return false;
    }
  }

  static getRaw(key: string): string | null {
    if (!StorageService.isAvailable()) return null;

    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn(`[StorageService] Failed to read key "${key}":`, error);
      return null;
    }
  }

  /**
   * Writes a raw string. On QuotaExceededError, removes the key and retries once.
   * When `options.evictPrefix` is set, also evicts oldest entries under that prefix.
   */
  static setRaw(key: string, value: string, options: EvictionOptions = {}): boolean {
    if (!StorageService.isAvailable()) return false;

    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (!StorageService.isQuotaError(error)) {
        console.warn(`[StorageService] Failed to write key "${key}":`, error);
        return false;
      }

      if (options.evictPrefix) {
        StorageService.evictOldest(
          options.evictPrefix,
          options.evictWhenAbove ?? 50,
          options.evictCount ?? 10,
        );
      }

      try {
        window.localStorage.removeItem(key);
        window.localStorage.setItem(key, value);
        return true;
      } catch (retryError) {
        console.warn(`[StorageService] Failed to write key "${key}" after quota recovery:`, retryError);
        return false;
      }
    }
  }

  static has(key: string): boolean {
    return StorageService.getRaw(key) !== null;
  }

  static remove(key: string): void {
    if (!StorageService.isAvailable()) return;

    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[StorageService] Failed to remove key "${key}":`, error);
    }
  }

  /**
   * JSON read with optional runtime validation.
   * Returns null on miss, parse failure or failed validation.
   */
  static get<T>(key: string, validate?: (value: unknown) => value is T): T | null {
    const raw = StorageService.getRaw(key);
    if (raw === null) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (validate && !validate(parsed)) return null;
      return parsed as T;
    } catch (error) {
      console.warn(`[StorageService] Failed to parse key "${key}":`, error);
      return null;
    }
  }

  static set<T>(key: string, value: T, options: EvictionOptions = {}): boolean {
    try {
      return StorageService.setRaw(key, JSON.stringify(value), options);
    } catch (error) {
      console.warn(`[StorageService] Failed to serialise key "${key}":`, error);
      return false;
    }
  }

  /**
   * Timestamped entries: expired reads are removed and reported as a miss.
   */
  static getWithTtl<T>(key: string, maxAgeMs: number): T | null {
    const envelope = StorageService.get<TtlEnvelope<T>>(key, isTtlEnvelope);
    if (!envelope) return null;

    if (Date.now() - envelope.timestamp > maxAgeMs) {
      StorageService.remove(key);
      return null;
    }

    return envelope.data;
  }

  static setWithTtl<T>(key: string, value: T, options: EvictionOptions = {}): boolean {
    const envelope: TtlEnvelope<T> = { data: value, timestamp: Date.now() };
    return StorageService.set(key, envelope, options);
  }

  /** Lists keys, optionally filtered by prefix. */
  static keys(prefix?: string): string[] {
    if (!StorageService.isAvailable()) return [];

    try {
      const all = Object.keys(window.localStorage);
      return prefix ? all.filter((key) => key.startsWith(prefix)) : all;
    } catch (error) {
      console.warn('[StorageService] Failed to list keys:', error);
      return [];
    }
  }

  /** Removes every key that starts with `prefix`. Returns how many were removed. */
  static removeByPrefix(prefix: string): number {
    const matching = StorageService.keys(prefix);
    matching.forEach((key) => StorageService.remove(key));
    return matching.length;
  }

  /**
   * Reads a Zustand-persisted payload (`{ state, version }`) outside of the store.
   * Useful at bootstrap time (i18n, auth shell) before the store has hydrated.
   */
  static readPersistedState<T>(key: string): T | null {
    const payload = StorageService.get<{ state?: T }>(key);
    return payload?.state ?? null;
  }

  /**
   * PersistStorage driver for the Zustand persist middleware.
   * Owns quota recovery and defensive reads so individual stores stay thin.
   */
  static createPersistStorage<S>(): PersistStorage<S> | undefined {
    const stateStorage: StateStorage = {
      getItem: (name: string): string | null => StorageService.getRaw(name),
      setItem: (name: string, value: string): void => {
        StorageService.setRaw(name, value);
      },
      removeItem: (name: string): void => {
        StorageService.remove(name);
      },
    };

    return createJSONStorage<S>(() => stateStorage);
  }

  private static isQuotaError(error: unknown): boolean {
    return (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    );
  }

  private static evictOldest(prefix: string, whenAbove: number, count: number): void {
    try {
      const matching = StorageService.keys(prefix);
      if (matching.length <= whenAbove) return;

      const entries = matching
        .map((key) => {
          const envelope = StorageService.get<{ timestamp?: number }>(key);
          if (typeof envelope?.timestamp !== 'number') return null;
          return { key, timestamp: envelope.timestamp };
        })
        .filter((entry): entry is { key: string; timestamp: number } => entry !== null);

      entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, count)
        .forEach((entry) => StorageService.remove(entry.key));
    } catch (error) {
      console.warn(`[StorageService] Failed to evict prefix "${prefix}":`, error);
    }
  }
}

function isTtlEnvelope<T>(value: unknown): value is TtlEnvelope<T> {
  return (
    !!value &&
    typeof value === 'object' &&
    'data' in value &&
    'timestamp' in value &&
    typeof (value as TtlEnvelope<unknown>).timestamp === 'number'
  );
}

export default StorageService;
