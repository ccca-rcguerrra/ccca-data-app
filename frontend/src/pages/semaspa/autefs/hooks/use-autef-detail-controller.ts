import { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';

import {
  useAutefForestGuidesQuery,
  useAutefHarvestUnitsQuery,
  useAutefQuery,
  useAutefRolesQuery,
  useAutefSpeciesQuery,
  useAutefVolumeBalancesQuery,
  usePeopleByIdsMap,
  useSpeciesProductsByIdsMap,
} from '@/hooks/api/use-semaspa';
import type { ApiPaginatedResponse } from '@/types/api';
import type { AutefSpecies, AutefVolumeBalance } from '@/types/semaspa';
import {
  useAutefDetailActions,
  useAutefDetailState,
  type AutefDetailTabId,
} from '../store/use-autef-detail-store';

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

export interface MergedAutefSpeciesRow {
  key: string;
  speciesProductId: string;
  original: AutefSpecies | null;
  balance: AutefVolumeBalance | null;
}

/**
 * Orchestrates AUTEF detail: header query, active-tab nested lists, enrichment.
 * Returns { api, store, handlers }.
 */
export function useAutefDetailController() {
  const params = useParams<{ id: string }>();
  const autefId = Number(params.id);
  const validId = Number.isInteger(autefId) && autefId > 0;

  const storeState = useAutefDetailState();
  const storeActions = useAutefDetailActions();
  const { activeTab, tabs } = storeState;

  const autefQuery = useAutefQuery(autefId, validId);

  const speciesParams = useMemo(
    () => ({ page: tabs.species.page, limit: tabs.species.pageSize }),
    [tabs.species.page, tabs.species.pageSize],
  );
  const forestGuidesParams = useMemo(
    () => ({ page: tabs.forestGuides.page, limit: tabs.forestGuides.pageSize }),
    [tabs.forestGuides.page, tabs.forestGuides.pageSize],
  );
  const harvestUnitsParams = useMemo(
    () => ({
      page: tabs.harvestUnits.page,
      limit: tabs.harvestUnits.pageSize,
      withGeom: true,
    }),
    [tabs.harvestUnits.page, tabs.harvestUnits.pageSize],
  );
  const rolesParams = useMemo(
    () => ({ page: tabs.roles.page, limit: tabs.roles.pageSize }),
    [tabs.roles.page, tabs.roles.pageSize],
  );

  const speciesEnabled = validId && activeTab === 'species';
  const speciesQuery = useAutefSpeciesQuery(autefId, speciesParams, {
    enabled: speciesEnabled,
  });
  const volumeBalancesQuery = useAutefVolumeBalancesQuery(autefId, speciesParams, {
    enabled: speciesEnabled,
  });
  const forestGuidesQuery = useAutefForestGuidesQuery(autefId, forestGuidesParams, {
    enabled: validId && activeTab === 'forestGuides',
  });
  const harvestUnitsQuery = useAutefHarvestUnitsQuery(autefId, harvestUnitsParams, {
    enabled: validId && activeTab === 'harvestUnits',
  });
  const rolesQuery = useAutefRolesQuery(autefId, rolesParams, {
    enabled: validId && activeTab === 'roles',
  });

  const mergedSpeciesRows = useMemo((): MergedAutefSpeciesRow[] => {
    const speciesRows = speciesQuery.data?.data ?? [];
    const balanceRows = volumeBalancesQuery.data?.data ?? [];
    const byProduct = new Map<string, MergedAutefSpeciesRow>();

    for (const row of speciesRows) {
      byProduct.set(row.speciesProductId, {
        key: row.id,
        speciesProductId: row.speciesProductId,
        original: row,
        balance: null,
      });
    }

    for (const balance of balanceRows) {
      const existing = byProduct.get(balance.speciesProductId);
      if (existing) {
        existing.balance = balance;
      } else {
        byProduct.set(balance.speciesProductId, {
          key: balance.id,
          speciesProductId: balance.speciesProductId,
          original: null,
          balance,
        });
      }
    }

    return Array.from(byProduct.values());
  }, [speciesQuery.data, volumeBalancesQuery.data]);

  const speciesProductIds = useMemo(
    () => mergedSpeciesRows.map((row) => row.speciesProductId),
    [mergedSpeciesRows],
  );

  const personIds = useMemo(
    () => (rolesQuery.data?.data ?? []).map((row) => row.personId),
    [rolesQuery.data],
  );

  const speciesProductsMap = useSpeciesProductsByIdsMap(speciesProductIds);
  const peopleMap = usePeopleByIdsMap(personIds);

  useEffect(() => {
    storeActions.reset();
    return () => {
      storeActions.reset();
    };
  }, [autefId, storeActions]);

  const handleActiveTabChange = useCallback(
    (tab: string) => {
      storeActions.setActiveTab(tab as AutefDetailTabId);
    },
    [storeActions],
  );

  const handleTabPageChange = useCallback(
    (tab: AutefDetailTabId, page: number) => {
      storeActions.setTabPage(tab, page);
    },
    [storeActions],
  );

  const handleTabPageSizeChange = useCallback(
    (tab: AutefDetailTabId, pageSize: number) => {
      storeActions.setTabPageSize(tab, pageSize);
    },
    [storeActions],
  );

  const handleOpenForestGuide = useCallback(
    (id: number) => {
      storeActions.openForestGuideSheet(id);
    },
    [storeActions],
  );

  const handleForestGuideSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) storeActions.closeForestGuideSheet();
    },
    [storeActions],
  );

  return {
    api: {
      autefId,
      validId,
      autef: autefQuery.data ?? null,
      isLoadingAutef: autefQuery.isLoading,
      isErrorAutef: autefQuery.isError,
      errorAutef: autefQuery.error,
      isNotFound:
        autefQuery.isError &&
        (autefQuery.error as { response?: { status?: number } })?.response?.status === 404,
      species: speciesQuery.data ?? emptyPagination(),
      volumeBalances: volumeBalancesQuery.data ?? emptyPagination(),
      mergedSpeciesRows,
      isLoadingSpecies:
        speciesQuery.isLoading ||
        speciesQuery.isFetching ||
        volumeBalancesQuery.isLoading ||
        volumeBalancesQuery.isFetching,
      forestGuides: forestGuidesQuery.data ?? emptyPagination(),
      isLoadingForestGuides: forestGuidesQuery.isLoading || forestGuidesQuery.isFetching,
      harvestUnits: harvestUnitsQuery.data ?? emptyPagination(),
      isLoadingHarvestUnits: harvestUnitsQuery.isLoading || harvestUnitsQuery.isFetching,
      roles: rolesQuery.data ?? emptyPagination(),
      isLoadingRoles: rolesQuery.isLoading || rolesQuery.isFetching,
      speciesProductsMap,
      peopleMap,
    },
    store: {
      state: storeState,
      actions: storeActions,
    },
    handlers: {
      handleActiveTabChange,
      handleTabPageChange,
      handleTabPageSizeChange,
      handleOpenForestGuide,
      handleForestGuideSheetOpenChange,
    },
  };
}

export type AutefDetailController = ReturnType<typeof useAutefDetailController>;
