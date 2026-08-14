/** Bounding box as [west, south, east, north] in lng/lat. */
export type TerritoryBbox = [number, number, number, number];

export interface Territory {
  id: number;
  version: number;
  name: string;
  category: string;
  categoryName: string | null;
  source: string;
  areaHa: number | null;
  enabled: boolean;
  /** Present when requested with `withBbox=true`. */
  bbox?: TerritoryBbox | null;
}

/**
 * Query params for GET /api/territories (aligned with backend GetTerritoriesQueryDto).
 * - search: filter by territory name (partial match); frontend should debounce (300–500ms).
 * - category: filter by territory category; comma-separated for multiple (e.g. state, city, refined_biome).
 */
export interface TerritoriesListParams {
  page?: number;
  limit?: number;
  /** Filter by territory name (partial match). Debounce on frontend (300–500ms). */
  search?: string;
  withGeom?: boolean;
  /** Include the territory bounding box ([west, south, east, north]) in the response. */
  withBbox?: boolean;
  /**
   * Filter by territory category. Single value or array; sent as comma-separated to API.
   * Example: 'refined_biome' for biome_refined territories in team form.
   */
  category?: string | string[];
}


