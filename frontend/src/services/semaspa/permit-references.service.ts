import { api } from '@/services/api';
import type { ApiPaginatedResponse } from '@/types/api';
import type { PermitReference, PermitReferenceListParams } from '@/types/semaspa';

function appendDefined(
  target: Record<string, string | number | boolean>,
  key: string,
  value: string | number | boolean | undefined | null,
) {
  if (value === undefined || value === null || value === '') return;
  target[key] = value;
}

export class PermitReferencesService {
  private static readonly BASE_URL = '/api/semaspa/permit-references';

  static async findAll(
    params: PermitReferenceListParams = {},
  ): Promise<ApiPaginatedResponse<PermitReference>> {
    const queryParams: Record<string, string | number | boolean> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    appendDefined(queryParams, 'matchStatus', params.matchStatus);
    appendDefined(queryParams, 'issuedFrom', params.issuedFrom);
    appendDefined(queryParams, 'issuedTo', params.issuedTo);
    appendDefined(queryParams, 'type', params.type?.trim());
    appendDefined(queryParams, 'multiple', params.multiple);
    appendDefined(queryParams, 'search', params.search?.trim());
    const response = await api.get<ApiPaginatedResponse<PermitReference>>(
      PermitReferencesService.BASE_URL,
      { params: queryParams },
    );
    return response.data;
  }
}
