import { api } from '@/services/api';
import type { ApiPaginatedResponse, ApiResponse } from '@/types/api';
import type {
  User,
  OnlineUser,
  UsersListParams,
  CreateUserDto,
  UpdateUserDto,
} from '@/types/users';

/**
 * Users service for managing users
 */
export class UsersService {
  private static readonly BASE_URL = '/api/users';

  /**
   * Get paginated list of users
   */
  static async findAll(params: UsersListParams = {}): Promise<ApiPaginatedResponse<User>> {
    const { page = 1, limit = 10, search, teamId } = params;

    const queryParams: Record<string, string | number | string[]> = { page, limit };
    if (search && search.trim()) {
      queryParams.search = search.trim();
    }
    if (teamId && teamId.length > 0) {
      queryParams.teamId = teamId.map((t) => String(t));
    }

    const response = await api.get<ApiPaginatedResponse<User>>(UsersService.BASE_URL, {
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
   * Get a specific user by ID
   */
  static async findOne(id: number): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`${UsersService.BASE_URL}/${id}`);
    return response.data.data;
  }

  /**
   * Remove a user from the system
   */
  static async remove(id: number): Promise<void> {
    await api.delete(`${UsersService.BASE_URL}/${id}`);
  }
  /**
   * Create a new user (POST /api/users, body: CreateUserDto)
   */
  static async create(body: CreateUserDto): Promise<void> {
    await api.post(`${UsersService.BASE_URL}`, body);
  }

  /**
   * Update a user (PATCH /api/users/:id, body must include id per UpdateUserDto)
   */
  static async update(id: number, body: UpdateUserDto): Promise<void> {
    await api.patch(`${UsersService.BASE_URL}/${id}`, { ...body, id });
  }

  /**
   * Get currently online users (GET /api/users/online)
   */
  static async findOnline(): Promise<OnlineUser[]> {
    const response = await api.get<{ data: OnlineUser[]; total: number }>(
      `${UsersService.BASE_URL}/online`
    );
    return response.data.data;
  }
}


// Export individual functions for convenience
export const {
  findAll: getUsers,
  findOne: getUser,
  remove: deleteUser,
  create: createUser,
  update: updateUser,
} = UsersService;

// Export the service class as default
export default UsersService;

