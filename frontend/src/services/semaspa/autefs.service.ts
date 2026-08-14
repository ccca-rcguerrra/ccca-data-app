import { api } from '@/services/api';
import type { ApiPaginatedResponse } from '@/types/api';
import type {
  Autef,
  AutefListParams,
  AutefSpecies,
  AutefVolumeBalance,
  ForestGuide,
  HarvestUnit,
  HarvestUnitsParams,
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
 * SEMASPA AUTEFs API client (read-only).
 */
export class AutefsService {
  private static readonly BASE_URL = '/api/semaspa/autefs';

  static async findAll(params: AutefListParams = {}): Promise<ApiPaginatedResponse<Autef>> {
    const queryParams: Record<string, string | number | boolean> = {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };

    appendDefined(queryParams, 'search', params.search?.trim());
    appendDefined(queryParams, 'city', params.city?.trim());
    appendDefined(queryParams, 'state', params.state?.trim());
    appendDefined(queryParams, 'issueYear', params.issueYear);
    appendDefined(queryParams, 'issueMonth', params.issueMonth);
    appendDefined(queryParams, 'processNumber', params.processNumber?.trim());
    appendDefined(queryParams, 'issuedFrom', params.issuedFrom);
    appendDefined(queryParams, 'issuedTo', params.issuedTo);
    appendDefined(queryParams, 'taxId', params.taxId?.trim());
    appendDefined(queryParams, 'personName', params.personName?.trim());
    appendDefined(queryParams, 'isOverExtracted', params.isOverExtracted);
    appendDefined(queryParams, 'hasForestGuide', params.hasForestGuide);
    appendDefined(queryParams, 'movedRatioMin', params.movedRatioMin);
    appendDefined(queryParams, 'movedRatioMax', params.movedRatioMax);
    appendDefined(queryParams, 'speciesProductId', params.speciesProductId?.trim());
    appendDefined(queryParams, 'scientificName', params.scientificName?.trim());
    appendDefined(queryParams, 'commonName', params.commonName?.trim());
    appendDefined(queryParams, 'sortBy', params.sortBy);
    appendDefined(queryParams, 'sortOrder', params.sortOrder);

    const response = await api.get<ApiPaginatedResponse<Autef>>(AutefsService.BASE_URL, {
      params: queryParams,
    });
    return response.data;
  }

  static async findOne(id: number): Promise<Autef> {
    const response = await api.get<Autef>(`${AutefsService.BASE_URL}/${id}`);
    return response.data;
  }

  static async findSpecies(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<AutefSpecies>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<AutefSpecies>>(
      `${AutefsService.BASE_URL}/${id}/species`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findVolumeBalances(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<AutefVolumeBalance>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<AutefVolumeBalance>>(
      `${AutefsService.BASE_URL}/${id}/volume-balances`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findForestGuides(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<ForestGuide>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<ForestGuide>>(
      `${AutefsService.BASE_URL}/${id}/forest-guides`,
      { params: { page, limit } },
    );
    return response.data;
  }

  static async findHarvestUnits(
    id: number,
    params: HarvestUnitsParams = {},
  ): Promise<ApiPaginatedResponse<HarvestUnit>> {
    const { page = 1, limit = 20, withGeom = false } = params;
    const response = await api.get<ApiPaginatedResponse<HarvestUnit>>(
      `${AutefsService.BASE_URL}/${id}/harvest-units`,
      { params: { page, limit, withGeom } },
    );
    return response.data;
  }

  static async findRoles(
    id: number,
    params: SemaspaPaginationParams = {},
  ): Promise<ApiPaginatedResponse<PersonRole>> {
    const { page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<PersonRole>>(
      `${AutefsService.BASE_URL}/${id}/roles`,
      { params: { page, limit } },
    );
    return response.data;
  }
}
