import { api } from '@/services/api';
import type { SpeciesProduct } from '@/types/semaspa';

/**
 * SEMASPA species-products API client (read-only, enrichment).
 */
export class SpeciesProductsService {
  private static readonly BASE_URL = '/api/semaspa/species-products';

  static async findOne(id: string): Promise<SpeciesProduct> {
    const response = await api.get<SpeciesProduct>(`${SpeciesProductsService.BASE_URL}/${id}`);
    return response.data;
  }
}
