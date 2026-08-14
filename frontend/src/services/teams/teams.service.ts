import { api } from '@/services/api';
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api';
import type {
  Team,
  TeamsListParams,
  CreateTeam,
  UpdateTeam,
} from '@/types/teams';

/**
 * Teams service for managing teams
 */
export class TeamsService {
  private static readonly BASE_URL = '/api/teams';

  /**
   * Get paginated list of teams
   */
  static async findAll(params: TeamsListParams = {}): Promise<ApiPaginatedResponse<Team>> {
    const { page = 1, limit = 10, search, users } = params;

    const queryParams: Record<string, string | number | number[]> = { page, limit };
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }
    if (users && users.length > 0) {
      queryParams.users = users;
    }

    const response = await api.get<ApiPaginatedResponse<Team>>(TeamsService.BASE_URL, {
      params: queryParams,
      paramsSerializer: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((item) => {
              searchParams.append(key, String(item));
            });
          } else {
            searchParams.append(key, String(value));
          }
        });
        return searchParams.toString();
      },
    });

    return response.data;
  }

  /**
   * Get a specific team by ID
   */
  static async findOne(id: number): Promise<Team> {
    const response = await api.get<ApiResponse<Team>>(`${TeamsService.BASE_URL}/${id}`);
    return response.data.data;
  }

  /**
   * Create a new team
   */
  static async create(team: CreateTeam): Promise<Team> {
    const response = await api.post<Team>(TeamsService.BASE_URL, team);
    return response.data;
  }

  /**
   * Update a team
   */
  static async update(id: number, team: UpdateTeam): Promise<Team> {
    const response = await api.patch<Team>(`${TeamsService.BASE_URL}/${id}`, team);
    return response.data;
  }

  /**
   * Remove a team from the system
   */
  static async remove(id: number): Promise<void> {
    await api.delete(`${TeamsService.BASE_URL}/${id}`);
  }
}

// Export individual functions for convenience
export const {
  findAll: getTeams,
  findOne: getTeam,
  create: createTeam,
  update: updateTeam,
  remove: deleteTeam,
} = TeamsService;

// Export the service class as default
export default TeamsService;








