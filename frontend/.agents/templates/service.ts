import { api } from '@/services/api';
import type { ApiResponse, ApiPaginatedResponse } from '@/types/api';
import type {
  DomainItem,
  DomainListParams,
  CreateDomainDto,
  UpdateDomainDto,
} from '@/types/domain';

export class DomainService {
  private static readonly BASE_URL = '/api/domain';

  static async findAll(
    params?: DomainListParams,
  ): Promise<ApiPaginatedResponse<DomainItem>> {
    const response = await api.get<ApiPaginatedResponse<DomainItem>>(
      DomainService.BASE_URL,
      { params },
    );
    return response.data;
  }

  static async findOne(
    id: number,
  ): Promise<ApiResponse<DomainItem>> {
    const response = await api.get<ApiResponse<DomainItem>>(
      `${DomainService.BASE_URL}/${id}`,
    );
    return response.data;
  }

  static async create(
    dto: CreateDomainDto,
  ): Promise<ApiResponse<DomainItem>> {
    const response = await api.post<ApiResponse<DomainItem>>(
      DomainService.BASE_URL,
      dto,
    );
    return response.data;
  }

  static async update(
    id: number,
    dto: UpdateDomainDto,
  ): Promise<ApiResponse<DomainItem>> {
    const response = await api.patch<ApiResponse<DomainItem>>(
      `${DomainService.BASE_URL}/${id}`,
      dto,
    );
    return response.data;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`${DomainService.BASE_URL}/${id}`);
  }
}
