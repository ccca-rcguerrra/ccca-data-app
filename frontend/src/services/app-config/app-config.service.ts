import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';
import type { AppConfig, InitiativePublicMetadata } from '@/types/app-config';

/**
 * AppConfig service (read-only). Fetches the per-initiative configuration
 * served by the backend.
 */
export class AppConfigService {
  private static readonly BASE_URL = '/api/app-config';
  private static readonly PUBLIC_METADATA_URL = '/api/initiative/public';

  /** Get the resolved system configuration for this initiative. */
  static async get(): Promise<AppConfig> {
    const response = await api.get<ApiResponse<AppConfig>>(
      AppConfigService.BASE_URL,
    );
    return response.data.data;
  }

  static async getPublicMetadata(): Promise<InitiativePublicMetadata> {
    const response = await api.get<ApiResponse<InitiativePublicMetadata>>(
      AppConfigService.PUBLIC_METADATA_URL,
    );
    return response.data.data;
  }
}
