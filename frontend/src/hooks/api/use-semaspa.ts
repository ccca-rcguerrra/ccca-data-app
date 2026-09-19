import { useMemo } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutefsService } from '@/services/semaspa/autefs.service';
import { ForestGuidesService } from '@/services/semaspa/forest-guides.service';
import { PeopleService } from '@/services/semaspa/people.service';
import { SpeciesProductsService } from '@/services/semaspa/species-products.service';
import { IndicatorsService } from '@/services/semaspa/indicators.service';
import { PermitReferencesService } from '@/services/semaspa/permit-references.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import type {
  AutefListParams,
  AutefVolumeBalanceParams,
  ForestGuideListParams,
  HarvestUnitsParams,
  IndicatorCasesParams,
  IndicatorFilters,
  IndicatorQueryId,
  Person,
  PersonAutefOccurrenceFlag,
  PersonGfOccurrenceFlag,
  PersonListParams,
  PermitReferenceListParams,
  SemaspaPaginationParams,
  SpeciesProduct,
  CreateIndicatorSavedFilterPayload,
} from '@/types/semaspa';

const LIST_STALE_MS = 1000 * 60 * 2;
const DETAIL_STALE_MS = 1000 * 60 * 5;

export const useAutefsQuery = (
  params: AutefListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.list(params),
    queryFn: () => AutefsService.findAll(params),
    staleTime: LIST_STALE_MS,
    gcTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
};

export const useAutefQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.detail(id),
    queryFn: () => AutefsService.findOne(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    staleTime: DETAIL_STALE_MS,
    gcTime: 1000 * 60 * 10,
  });
};

export const useAutefSpeciesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.species(id, params),
    queryFn: () => AutefsService.findSpecies(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefVolumeBalancesQuery = (
  id: number,
  params: AutefVolumeBalanceParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.volumeBalances(id, params),
    queryFn: () => AutefsService.findVolumeBalances(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefVolumeBalanceForestGuidesQuery = (
  id: number,
  speciesProductId: string,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.volumeBalanceForestGuides(
      id,
      speciesProductId,
      params,
    ),
    queryFn: () =>
      AutefsService.findVolumeBalanceForestGuides(id, speciesProductId, params),
    staleTime: LIST_STALE_MS,
    enabled:
      options?.enabled !== false &&
      Number.isInteger(id) &&
      id > 0 &&
      speciesProductId.length > 0,
  });
};

export const useAutefForestGuidesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.forestGuides(id, params),
    queryFn: () => AutefsService.findForestGuides(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefHarvestUnitsQuery = (
  id: number,
  params: HarvestUnitsParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.harvestUnits(id, params),
    queryFn: () => AutefsService.findHarvestUnits(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefRolesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.roles(id, params),
    queryFn: () => AutefsService.findRoles(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefPlatesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.plates(id, params),
    queryFn: () => AutefsService.findPlates(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useAutefRelatedQuery = (id: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.autefs.related(id),
    queryFn: () => AutefsService.findRelated(id),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useForestGuidesQuery = (
  params: ForestGuideListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.list(params),
    queryFn: () => ForestGuidesService.findAll(params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const useForestGuideQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.detail(id),
    queryFn: () => ForestGuidesService.findOne(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
    staleTime: DETAIL_STALE_MS,
  });
};

export const useForestGuideSpeciesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.species(id, params),
    queryFn: () => ForestGuidesService.findSpecies(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useForestGuideRolesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.roles(id, params),
    queryFn: () => ForestGuidesService.findRoles(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useForestGuideAutefsQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.autefs(id, params),
    queryFn: () => ForestGuidesService.findAutefs(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const useForestGuidePermitReferencesQuery = (
  id: number,
  params: SemaspaPaginationParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.forestGuides.permitReferences(id, params),
    queryFn: () => ForestGuidesService.findPermitReferences(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && Number.isInteger(id) && id > 0,
  });
};

export const usePermitReferencesQuery = (
  params: PermitReferenceListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.permitReferences.list(params),
    queryFn: () => PermitReferencesService.findAll(params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const usePeopleQuery = (
  params: PersonListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.people.list(params),
    queryFn: () => PeopleService.findAll(params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const usePersonQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.people.detail(id),
    queryFn: () => PeopleService.findOne(id),
    enabled: enabled && id.length > 0,
    staleTime: DETAIL_STALE_MS,
    gcTime: 1000 * 60 * 10,
  });
};

export const usePersonParticipationQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.people.participation(id),
    queryFn: () => PeopleService.findParticipation(id),
    enabled: enabled && id.length > 0,
    staleTime: DETAIL_STALE_MS,
  });
};

export const usePersonAutefsQuery = (
  id: string,
  params: SemaspaPaginationParams & { flag?: PersonAutefOccurrenceFlag } = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.people.autefs(id, params),
    queryFn: () => PeopleService.findAutefs(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && id.length > 0,
  });
};

export const usePersonForestGuidesQuery = (
  id: string,
  params: SemaspaPaginationParams & { flag?: PersonGfOccurrenceFlag } = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.people.forestGuides(id, params),
    queryFn: () => PeopleService.findForestGuides(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false && id.length > 0,
  });
};

export const usePeopleByIdsMap = (ids: string[]) => {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))),
    [ids],
  );

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: QUERY_KEYS.semaspa.people.detail(id),
      queryFn: () => PeopleService.findOne(id),
      staleTime: DETAIL_STALE_MS,
      gcTime: 1000 * 60 * 10,
    })),
  });

  return useMemo(() => {
    const map: Record<string, Person> = {};
    queries.forEach((query, index) => {
      const person = query.data;
      const id = uniqueIds[index];
      if (!person || !id) return;
      map[id] = person;
    });
    return map;
  }, [queries, uniqueIds]);
};

export const useSpeciesProductsByIdsMap = (ids: string[]) => {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.length > 0))),
    [ids],
  );

  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: QUERY_KEYS.semaspa.speciesProducts.detail(id),
      queryFn: () => SpeciesProductsService.findOne(id),
      staleTime: DETAIL_STALE_MS,
      gcTime: 1000 * 60 * 10,
    })),
  });

  return useMemo(() => {
    const map: Record<string, SpeciesProduct> = {};
    queries.forEach((query, index) => {
      const product = query.data;
      const id = uniqueIds[index];
      if (!product || !id) return;
      map[id] = product;
    });
    return map;
  }, [queries, uniqueIds]);
};

export const useIndicatorSummaryQuery = (
  params: IndicatorFilters = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.indicators.summary(params),
    queryFn: () => IndicatorsService.getSummary(params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const useIndicatorCasesQuery = (
  id: IndicatorQueryId,
  params: IndicatorCasesParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.indicators.cases(id, params),
    queryFn: () => IndicatorsService.findCases(id, params),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const useIndicatorSavedFiltersQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: QUERY_KEYS.semaspa.indicators.savedFilters(),
    queryFn: () => IndicatorsService.listSavedFilters(),
    staleTime: LIST_STALE_MS,
    enabled: options?.enabled !== false,
  });
};

export const useCreateIndicatorSavedFilterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIndicatorSavedFilterPayload) =>
      IndicatorsService.createSavedFilter(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.semaspa.indicators.savedFilters(),
      });
    },
  });
};

export const useDeleteIndicatorSavedFilterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => IndicatorsService.deleteSavedFilter(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.semaspa.indicators.savedFilters(),
      });
    },
  });
};
