import { api } from '@/services/api';
import type { ApiPaginatedResponse } from '@/types/api';
import type {
  Autef,
  ForestGuide,
  ForestGuideListParams,
  ForestGuideSpecies,
  PermitReference,
  PersonRole,
  SemaspaPaginationParams,
} from '@/types/semaspa';

function appendDefined(
  target: Record<string, string | number | boolean>,
  key: string,
  value: string | number | boolean | undefined | null,
) {
  if (value === undefined || value === null || value === '') return;
  target[key] = value;
}

/**
 * SEMASPA forest guides API client (read-only).
 */
export class ForestGuidesService {
  private static readonly BASE_URL = '/api/semaspa/forest-guides';

  static async findAll(
    params: ForestGuideListParams = {},
  ): Promise<ApiPaginatedResponse<ForestGuide>> {
    const queryParams: Record<string, string | number | boolean> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };

    appendDefined(queryParams, 'search', params.search?.trim());
    appendDefined(queryParams, 'status', params.status?.trim());
    appendDefined(queryParams, 'type', params.type?.trim());
    appendDefined(queryParams, 'issuedFrom', params.issuedFrom);
    appendDefined(queryParams, 'issuedTo', params.issuedTo);
    appendDefined(queryParams, 'autefId', params.autefId);
    appendDefined(queryParams, 'taxId', params.taxId?.trim());
    appendDefined(queryParams, 'personName', params.personName?.trim());
    appendDefined(queryParams, 'speciesProductId', params.speciesProductId?.trim());
    appendDefined(queryParams, 'scientificName', params.scientificName?.trim());
    appendDefined(queryParams, 'commonName', params.commonName?.trim());
    appendDefined(queryParams, 'plate', params.plate?.trim());
    appendDefined(queryParams, 'permitRef', params.permitRef?.trim());
    appendDefined(queryParams, 'volumeMin', params.volumeMin);
    appendDefined(queryParams, 'volumeMax', params.volumeMax);
    appendDefined(queryParams, 'valueMin', params.valueMin);
    appendDefined(queryParams, 'valueMax', params.valueMax);
    appendDefined(queryParams, 'sortBy', params.sortBy);
    appendDefined(queryParams, 'sortOrder', params.sortOrder);

    const response = await api.get<ApiPaginatedResponse<ForestGuide>>(
      ForestGuidesService.BASE_URL,
      { params: queryParams },
    );
    return response.data;
  }

  static async findOne(id: number): Promise<ForestGuide> {
    const response = await api.get<ForestGuide>(`${ForestGuidesService.BASE_URL}/${id}`);
    return response.data;
  }

  static async findSpecies(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<ForestGuideSpecies>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<ForestGuideSpecies>>(
      `${ForestGuidesService.BASE_URL}/${id}/species`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findRoles(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<PersonRole>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<PersonRole>>(
      `${ForestGuidesService.BASE_URL}/${id}/roles`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findAutefs(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<Autef>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<Autef>>(
      `${ForestGuidesService.BASE_URL}/${id}/autefs`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findPermitReferences(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<PermitReference>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<PermitReference>>(
      `${ForestGuidesService.BASE_URL}/${id}/permit-references`,
      { params: { page, limit } },
    );
    return response.data;
  }
}
