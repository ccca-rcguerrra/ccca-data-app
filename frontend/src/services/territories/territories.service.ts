import { api } from '@/services/api';
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api';
import type {
  Territory,
  TerritoriesListParams,
} from '@/types/territories';

/**
 * Territories service for reading territories (read-only)
 */
export class TerritoriesService {
  private static readonly BASE_URL = '/api/territories';

  /**
   * Get paginated list of territories.
   * API: page, limit, search (name partial match), category (comma-separated), withGeom.
   */
  static async findAll(params: TerritoriesListParams = {}): Promise<ApiPaginatedResponse<Territory>> {
    const { page = 1, limit = 10, search, withGeom, withBbox, category } = params;

    const queryParams: Record<string, string | number | boolean> = { page, limit };
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }
    if (withGeom !== undefined) {
      queryParams.withGeom = withGeom;
    }
    if (withBbox !== undefined) {
      queryParams.withBbox = withBbox;
    }
    if (category != null) {
      const categoryStr = Array.isArray(category)
        ? category.filter(Boolean).join(',')
        : String(category).trim();
      if (categoryStr) {
        queryParams.category = categoryStr;
      }
    }

    const response = await api.get<ApiPaginatedResponse<Territory>>(TerritoriesService.BASE_URL, {
      params: queryParams,
    });

    return response.data;
  }

  /**
   * Get a specific territory by ID.
   * When `withBbox` is true the response includes the territory bounding box
   * ([west, south, east, north]) instead of the full geometry.
   */
  static async findOne(id: number, withBbox?: boolean): Promise<Territory> {
    const response = await api.get<ApiResponse<Territory>>(`${TerritoriesService.BASE_URL}/${id}`, {
      params: withBbox !== undefined ? { withBbox } : undefined,
    });
    return response.data.data;
  }
}

// Export individual functions for convenience
export const {
  findAll: getTerritories,
  findOne: getTerritory,
} = TerritoriesService;

// Export the service class as default
export default TerritoriesService;




