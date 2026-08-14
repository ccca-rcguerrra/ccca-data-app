/**
 * SRID (projection) of the stored alert/territory geometries, which varies per
 * initiative: BR uses 4674 (SIRGAS 2000), PER uses 4326 (WGS84), etc.
 *
 * Set it per deploy via `MB_ALERTA_APP_GEO_SRID` (defaults to 4674). Used to
 * label/transform input geometries in raw SQL so they match `*.geom` columns
 * (e.g. ST_SetSRID on the intersects filter, ST_Transform of MVT tile envelopes).
 */
const DEFAULT_GEOM_SRID = 4674;

/**
 * Resolve the geometry SRID from the environment at call time. Read lazily (not
 * at import) because the app loads `.env` via ConfigModule during bootstrap,
 * after entity/service modules are first imported.
 */
export function getGeomSrid(): number {
  const raw = process.env.APP_GEO_SRID;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_GEOM_SRID;
}

/**
 * Same value resolved once at import, for TypeORM `@Column({ srid })` metadata
 * (decorators need a concrete number). `main.ts` loads `.env` before any entity
 * is imported, so this reflects `MB_ALERTA_APP_GEO_SRID` (default: BR's 4674).
 */
export const GEOM_SRID = getGeomSrid();

/**
 * CRS used when exporting GEE imagery to GeoTIFF, as an `EPSG:<srid>` code.
 * Derived from the geometry SRID so the exported raster matches the initiative's
 * projection (BR: EPSG:4674; PER: EPSG:4326). Read at call time.
 */
export function getExportCrs(): string {
  return `EPSG:${getGeomSrid()}`;
}
