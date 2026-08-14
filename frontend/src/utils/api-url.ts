import { api } from '@/services/api';

/**
 * Resolve a backend-relative path (or XYZ tile template) to an absolute URL
 * against the API origin.
 *
 * The GEE PNG/map-layer endpoints now return a path to our own proxy (e.g.
 * `/api/gee/.../raw/<token>` or `.../raw/<token>/{z}/{x}/{y}`); the browser and
 * MapLibre need an absolute URL. Values that are already absolute (http/https)
 * are returned unchanged — so mixed lists (workspace = proxied path, SCCON =
 * absolute GEE URL) resolve correctly.
 *
 * Unlike `new URL(path, base)`, this preserves `{z}/{x}/{y}` placeholders (URL
 * would percent-encode the braces to `%7Bz%7D` and break tile substitution).
 */
export function resolveApiUrl(pathOrUrl: string): string {
  if (!pathOrUrl.startsWith('/')) {
    return pathOrUrl;
  }
  const base = api.defaults.baseURL ?? window.location.origin;
  const origin = new URL(base, window.location.origin).origin;
  return origin + pathOrUrl;
}
