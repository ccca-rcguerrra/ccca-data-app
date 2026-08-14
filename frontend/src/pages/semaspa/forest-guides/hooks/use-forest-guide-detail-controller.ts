import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';

import {
  useForestGuideAutefsQuery,
  useForestGuideQuery,
  useForestGuideRolesQuery,
  useForestGuideSpeciesQuery,
  usePeopleByIdsMap,
  useSpeciesProductsByIdsMap,
} from '@/hooks/api/use-semaspa';
import type { ApiPaginatedResponse } from '@/types/api';
import {
  useForestGuideDetailActions,
  useForestGuideDetailState,
  type ForestGuideDetailTabId,
} from '../store/use-forest-guide-detail-store';

function emptyPagination<T>(): ApiPaginatedResponse<T> {
  return {
    data: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
}

export function useForestGuideDetailController() {
  const params = useParams<{ id: string }>();
  const forestGuideId = Number(params.id);
  const validId = Number.isInteger(forestGuideId) && forestGuideId > 0;

  const storeState = useForestGuideDetailState();
  const storeActions = useForestGuideDetailActions();
  const { activeTab, tabs } = storeState;

  const detailQuery = useForestGuideQuery(forestGuideId, validId);

  const speciesParams = useMemo(
    () => ({ page: tabs.species.page, limit: tabs.species.pageSize }),
    [tabs.species.page, tabs.species.pageSize],
  );
  const rolesParams = useMemo(
    () => ({ page: tabs.roles.page, limit: tabs.roles.pageSize }),
    [tabs.roles.page, tabs.roles.pageSize],
  );
  const autefsParams = useMemo(
    () => ({ page: tabs.autefs.page, limit: tabs.autefs.pageSize }),
    [tabs.autefs.page, tabs.autefs.pageSize],
  );

  const speciesQuery = useForestGuideSpeciesQuery(forestGuideId, speciesParams, {
    enabled: validId && activeTab === 'species',
  });
  const rolesQuery = useForestGuideRolesQuery(forestGuideId, rolesParams, {
    enabled: validId && activeTab === 'roles',
  });
  const autefsQuery = useForestGuideAutefsQuery(forestGuideId, autefsParams, {
    enabled: validId && activeTab === 'autefs',
  });

  const speciesProductIds = useMemo(
    () => (speciesQuery.data?.data ?? []).map((row) => row.speciesProductId),
    [speciesQuery.data],
  );
  const personIds = useMemo(
    () => (rolesQuery.data?.data ?? []).map((row) => row.personId),
    [rolesQuery.data],
  );

  const speciesProductsMap = useSpeciesProductsByIdsMap(speciesProductIds);
  const peopleMap = usePeopleByIdsMap(personIds);

  useEffect(() => {
    storeActions.reset();
    return () => storeActions.reset();
  }, [forestGuideId, storeActions]);

  return {
    api: {
      forestGuideId,
      validId,
      forestGuide: detailQuery.data ?? null,
      isLoadingDetail: detailQuery.isLoading,
      isErrorDetail: detailQuery.isError,
      errorDetail: detailQuery.error,
      isNotFound:
        detailQuery.isError &&
        (detailQuery.error as { response?: { status?: number } })?.response?.status === 404,
      species: speciesQuery.data ?? emptyPagination(),
      isLoadingSpecies: speciesQuery.isLoading || speciesQuery.isFetching,
      roles: rolesQuery.data ?? emptyPagination(),
      isLoadingRoles: rolesQuery.isLoading || rolesQuery.isFetching,
      autefs: autefsQuery.data ?? emptyPagination(),
      isLoadingAutefs: autefsQuery.isLoading || autefsQuery.isFetching,
      speciesProductsMap,
      peopleMap,
    },
    store: { state: storeState, actions: storeActions },
    handlers: {
      handleActiveTabChange: useCallback(
        (tab: string) => storeActions.setActiveTab(tab as ForestGuideDetailTabId),
        [storeActions],
      ),
      handleTabPageChange: useCallback(
        (tab: ForestGuideDetailTabId, page: number) => storeActions.setTabPage(tab, page),
        [storeActions],
      ),
      handleTabPageSizeChange: useCallback(
        (tab: ForestGuideDetailTabId, pageSize: number) =>
          storeActions.setTabPageSize(tab, pageSize),
        [storeActions],
      ),
    },
  };
}

export type ForestGuideDetailController = ReturnType<typeof useForestGuideDetailController>;
