import type {
  CreateIndicatorSavedFilterPayload,
  IndicatorCase,
  IndicatorCasesParams,
  IndicatorFilters,
  IndicatorQueryId,
  IndicatorSavedFilter,
  IndicatorSummary,
  UpdateIndicatorSavedFilterPayload,
} from '@/types/semaspa';
import type { ApiPaginatedResponse } from '@/types/api';
import { api } from '@/services/api';

function appendDefined(
  target: Record<string, string | number | boolean>,
  key: string,
  value: string | number | boolean | undefined | null,
) {
  if (value === undefined || value === null || value === '') return;
  target[key] = value;
}

function toFilterParams(
  params: IndicatorFilters | IndicatorCasesParams = {},
): Record<string, string | number | boolean> {
  const queryParams: Record<string, string | number | boolean> = {};
  appendDefined(queryParams, 'city', params.city?.trim());
  appendDefined(queryParams, 'state', params.state?.trim());
  appendDefined(queryParams, 'issuedFrom', params.issuedFrom);
  appendDefined(queryParams, 'issuedTo', params.issuedTo);
  appendDefined(queryParams, 'speciesProductId', params.speciesProductId?.trim());
  appendDefined(queryParams, 'scientificName', params.scientificName?.trim());
  appendDefined(queryParams, 'commonName', params.commonName?.trim());
  appendDefined(queryParams, 'movedRatioMin', params.movedRatioMin);
  appendDefined(queryParams, 'movedRatioMax', params.movedRatioMax);
  appendDefined(queryParams, 'excessVolumeMin', params.excessVolumeMin);
  return queryParams;
}

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}

/**
 * Investigative indicator center API client (read-only).
 */
export class IndicatorsService {
  private static readonly BASE_URL = '/api/semaspa/indicators';

  static async getSummary(params: IndicatorFilters = {}): Promise<IndicatorSummary> {
    const response = await api.get<IndicatorSummary>(`${IndicatorsService.BASE_URL}/summary`, {
      params: toFilterParams(params),
    });
    return response.data;
  }

  static async findCases(
    id: IndicatorQueryId,
    params: IndicatorCasesParams = {},
  ): Promise<ApiPaginatedResponse<IndicatorCase>> {
    const queryParams: Record<string, string | number | boolean> = {
      ...toFilterParams(params),
      page: params.page ?? 1,
      limit: params.limit ?? 20,
    };
    appendDefined(queryParams, 'sortBy', params.sortBy);
    appendDefined(queryParams, 'sortOrder', params.sortOrder);

    const response = await api.get<ApiPaginatedResponse<IndicatorCase>>(
      `${IndicatorsService.BASE_URL}/${id}/cases`,
      { params: queryParams },
    );
    return response.data;
  }

  static async exportCasesCsv(
    id: IndicatorQueryId,
    params: IndicatorFilters = {},
  ): Promise<void> {
    const response = await api.get<Blob>(`${IndicatorsService.BASE_URL}/${id}/cases.csv`, {
      params: toFilterParams(params),
      responseType: 'blob',
    });
    const filename = filenameFromDisposition(
      response.headers['content-disposition'] as string | undefined,
      `indicator-cases-${id}.csv`,
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  static async listSavedFilters(): Promise<IndicatorSavedFilter[]> {
    const response = await api.get<IndicatorSavedFilter[]>(
      `${IndicatorsService.BASE_URL}/saved-filters`,
    );
    return response.data;
  }

  static async createSavedFilter(
    payload: CreateIndicatorSavedFilterPayload,
  ): Promise<IndicatorSavedFilter> {
    const response = await api.post<IndicatorSavedFilter>(
      `${IndicatorsService.BASE_URL}/saved-filters`,
      payload,
    );
    return response.data;
  }

  static async updateSavedFilter(
    id: number,
    payload: UpdateIndicatorSavedFilterPayload,
  ): Promise<IndicatorSavedFilter> {
    const response = await api.patch<IndicatorSavedFilter>(
      `${IndicatorsService.BASE_URL}/saved-filters/${id}`,
      payload,
    );
    return response.data;
  }

  static async deleteSavedFilter(id: number): Promise<void> {
    await api.delete(`${IndicatorsService.BASE_URL}/saved-filters/${id}`);
  }
}
