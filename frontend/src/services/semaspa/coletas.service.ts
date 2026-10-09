import type {
  Coleta,
  ColetaListParams,
  CreateColetaPayload,
} from '@/types/semaspa';
import { api } from '@/services/api';

export interface ColetaListResponse {
  runs: Coleta[];
  total: number;
}

export class ColetasService {
  private static readonly BASE_URL = '/api/semaspa/coletas';

  static async list(params: ColetaListParams = {}): Promise<ColetaListResponse> {
    const response = await api.get<ColetaListResponse>(ColetasService.BASE_URL, {
      params,
    });
    return response.data;
  }

  static async findOne(taskId: string): Promise<Coleta> {
    const response = await api.get<Coleta>(
      `${ColetasService.BASE_URL}/${taskId}`,
    );
    return response.data;
  }

  static async create(payload: CreateColetaPayload): Promise<Coleta> {
    const response = await api.post<Coleta>(ColetasService.BASE_URL, payload);
    return response.data;
  }

  static async reprocess(taskId: string): Promise<Coleta> {
    const response = await api.post<Coleta>(
      `${ColetasService.BASE_URL}/${taskId}/reprocess`,
    );
    return response.data;
  }

  static async cancel(taskId: string): Promise<{ taskId: string; revoked: number; total: number }> {
    const response = await api.post<{ taskId: string; revoked: number; total: number }>(
      `${ColetasService.BASE_URL}/${taskId}/cancel`,
    );
    return response.data;
  }
}
