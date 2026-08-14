import { api } from '@/services/api';
import type { Person } from '@/types/semaspa';

/**
 * SEMASPA people API client (read-only, enrichment).
 */
export class PeopleService {
  private static readonly BASE_URL = '/api/semaspa/people';

  static async findOne(id: string): Promise<Person> {
    const response = await api.get<Person>(`${PeopleService.BASE_URL}/${id}`);
    return response.data;
  }
}
