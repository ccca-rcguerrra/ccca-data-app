import { api } from '@/services/api';
import type { ApiPaginatedResponse } from '@/types/api';
import type {
  Person,
  PersonLinkedAutef,
  PersonLinkedForestGuide,
  PersonListParams,
  PersonParticipation,
  PersonRole,
  PersonAutefOccurrenceFlag,
  PersonGfOccurrenceFlag,
  SemaspaPaginationParams,
} from '@/types/semaspa';

/**
 * SEMASPA people API client (read-only).
 */
export class PeopleService {
  private static readonly BASE_URL = '/api/semaspa/people';

  static async findAll(params: PersonListParams = {}): Promise<ApiPaginatedResponse<Person>> {
    const { page = 1, limit = 20, search } = params;
    const queryParams: Record<string, string | number> = { page, limit };
    if (search?.trim()) queryParams.search = search.trim();
    const response = await api.get<ApiPaginatedResponse<Person>>(PeopleService.BASE_URL, {
      params: queryParams,
    });
    return response.data;
  }

  static async findOne(id: string): Promise<Person> {
    const response = await api.get<Person>(`${PeopleService.BASE_URL}/${id}`);
    return response.data;
  }

  static async findParticipation(id: string): Promise<PersonParticipation> {
    const response = await api.get<PersonParticipation>(
      `${PeopleService.BASE_URL}/${id}/participation`,
    );
    return response.data;
  }

  static async findAutefs(
    id: string,
    params: SemaspaPaginationParams & { flag?: PersonAutefOccurrenceFlag } = {},
  ): Promise<ApiPaginatedResponse<PersonLinkedAutef>> {
    const { page = 1, limit = 20, flag } = params;
    const queryParams: Record<string, string | number> = { page, limit };
    if (flag) queryParams.flag = flag;
    const response = await api.get<ApiPaginatedResponse<PersonLinkedAutef>>(
      `${PeopleService.BASE_URL}/${id}/autefs`,
      { params: queryParams },
    );
    return response.data;
  }

  static async findForestGuides(
    id: string,
    params: SemaspaPaginationParams & { flag?: PersonGfOccurrenceFlag } = {},
  ): Promise<ApiPaginatedResponse<PersonLinkedForestGuide>> {
    const { page = 1, limit = 20, flag } = params;
    const queryParams: Record<string, string | number> = { page, limit };
    if (flag) queryParams.flag = flag;
    const response = await api.get<ApiPaginatedResponse<PersonLinkedForestGuide>>(
      `${PeopleService.BASE_URL}/${id}/forest-guides`,
      { params: queryParams },
    );
    return response.data;
  }

  static async findRoles(
    id: string,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<PersonRole>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<PersonRole>>(
      `${PeopleService.BASE_URL}/${id}/roles`,
      { params: { page, limit } },
    );
    return response.data;
  }
}
