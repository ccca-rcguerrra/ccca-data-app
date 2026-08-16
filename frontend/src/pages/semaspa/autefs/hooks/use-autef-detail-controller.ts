import { useParams } from 'react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  AutefSpecies,
  AutefVolumeBalance,
  AutefVolumeBalanceSortField,
  Person,
  PersonRole,
  VolumeBalanceForestGuidesResponse,
} from '@/types/semaspa';
import type { ApiPaginatedResponse } from '@/types/api';
import { AutefsService } from '@/services/semaspa/autefs.service';
import {
  useAutefForestGuidesQuery,
  useAutefHarvestUnitsQuery,
  useAutefQuery,
  useAutefRolesQuery,
  useAutefSpeciesQuery,
  useAutefVolumeBalanceForestGuidesQuery,
  useAutefVolumeBalancesQuery,
  usePeopleByIdsMap,
  useSpeciesProductsByIdsMap,
} from '@/hooks/api/use-semaspa';

import { formatPersonLabel } from '../utils/format';
import { deriveDossierFlags } from '../utils/dossier-flags';
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

function emptyContributions(): VolumeBalanceForestGuidesResponse {
  return {
    ...emptyPagination(),
    limit: 100,
    movedVolumeSum: 0,
    crossingForestGuideId: null,
  };
}

export interface MergedAutefSpeciesRow {
  key: string;
  speciesProductId: string;
  original: AutefSpecies | null;
  balance: AutefVolumeBalance | null;
}

export interface DossierActorRef {
  label: string;
  personId: string;
}

export interface DossierActorSummary {
  owner: DossierActorRef | null;
  technicalResponsible: DossierActorRef | null;
  analyst: DossierActorRef | null;
}

const HEADER_LIST_PARAMS = { page: 1, limit: 100 };
const HEADER_COUNT_PARAMS = { page: 1, limit: 1 };
const HEADER_UPA_PARAMS = { page: 1, limit: 20, withGeom: false };
const CONTRIBUTION_PARAMS = { page: 1, limit: 100 };

function firstRoleActor(
  roles: PersonRole[],
  peopleMap: Record<string, Person>,
  role: string,
): DossierActorRef | null {
  const match = roles.find((row) => row.role === role);
  if (!match) return null;
  return {
    personId: match.personId,
    label: formatPersonLabel(peopleMap[match.personId], match.personId),
  };
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
  const { activeTab, tabs, creditSortBy, creditSortOrder, selectedSpeciesProductId } =
    storeState;
  const [isExportingCredit, setIsExportingCredit] = useState(false);
  const [creditExportError, setCreditExportError] = useState<string | null>(null);

  const autefQuery = useAutefQuery(autefId, validId);

  const speciesLookupParams = HEADER_LIST_PARAMS;
  const volumeBalanceParams = useMemo(
    () => ({
      page: tabs.species.page,
      limit: tabs.species.pageSize,
      sortBy: creditSortBy,
      sortOrder: creditSortOrder,
    }),
    [tabs.species.page, tabs.species.pageSize, creditSortBy, creditSortOrder],
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

  const headerBalancesQuery = useAutefVolumeBalancesQuery(autefId, HEADER_LIST_PARAMS, {
    enabled: validId,
  });
  const headerRolesQuery = useAutefRolesQuery(autefId, HEADER_LIST_PARAMS, {
    enabled: validId,
  });
  const headerForestGuidesQuery = useAutefForestGuidesQuery(autefId, HEADER_COUNT_PARAMS, {
    enabled: validId,
  });
  const headerHarvestUnitsQuery = useAutefHarvestUnitsQuery(autefId, HEADER_UPA_PARAMS, {
    enabled: validId,
  });

  const speciesEnabled = validId && activeTab === 'species';
  const speciesQuery = useAutefSpeciesQuery(autefId, speciesLookupParams, {
    enabled: speciesEnabled,
  });
  const volumeBalancesQuery = useAutefVolumeBalancesQuery(autefId, volumeBalanceParams, {
    enabled: speciesEnabled,
  });
  const contributionsQuery = useAutefVolumeBalanceForestGuidesQuery(
    autefId,
    selectedSpeciesProductId ?? '',
    CONTRIBUTION_PARAMS,
    { enabled: validId && Boolean(selectedSpeciesProductId) },
  );
  const forestGuidesQuery = useAutefForestGuidesQuery(autefId, forestGuidesParams, {
    enabled: validId && activeTab === 'forestGuides',
  });
  const harvestUnitsQuery = useAutefHarvestUnitsQuery(autefId, harvestUnitsParams, {
    enabled: validId && activeTab === 'harvestUnits',
  });
  const rolesQuery = useAutefRolesQuery(autefId, rolesParams, {
    enabled: validId && activeTab === 'roles',
  });

  const speciesByProduct = useMemo(() => {
    const map = new Map<string, AutefSpecies>();
    for (const row of speciesQuery.data?.data ?? []) {
      map.set(row.speciesProductId, row);
    }
    return map;
  }, [speciesQuery.data]);

  const mergedSpeciesRows = useMemo((): MergedAutefSpeciesRow[] => {
    return (volumeBalancesQuery.data?.data ?? []).map((balance) => ({
      key: balance.id,
      speciesProductId: balance.speciesProductId,
      original: speciesByProduct.get(balance.speciesProductId) ?? null,
      balance,
    }));
  }, [volumeBalancesQuery.data, speciesByProduct]);

  const speciesProductIds = useMemo(() => {
    const fromBalances = mergedSpeciesRows.map((row) => row.speciesProductId);
    const selected = selectedSpeciesProductId;
    if (selected && !fromBalances.includes(selected)) {
      return [...fromBalances, selected];
    }
    return fromBalances;
  }, [mergedSpeciesRows, selectedSpeciesProductId]);

  const personIds = useMemo(() => {
    const fromHeader = (headerRolesQuery.data?.data ?? []).map((row) => row.personId);
    const fromTab = (rolesQuery.data?.data ?? []).map((row) => row.personId);
    return [...fromHeader, ...fromTab];
  }, [headerRolesQuery.data, rolesQuery.data]);

  const dossierFlags = useMemo(
    () =>
      deriveDossierFlags(
        headerBalancesQuery.data?.data ?? [],
        headerBalancesQuery.isSuccess,
      ),
    [headerBalancesQuery.data, headerBalancesQuery.isSuccess],
  );

  const speciesProductsMap = useSpeciesProductsByIdsMap(speciesProductIds);
  const peopleMap = usePeopleByIdsMap(personIds);

  const dossierActors = useMemo((): DossierActorSummary => {
    const roles = headerRolesQuery.data?.data ?? [];
    return {
      owner: firstRoleActor(roles, peopleMap, 'PROPRIETARIO'),
      technicalResponsible: firstRoleActor(roles, peopleMap, 'RESPONSAVEL_TECNICO'),
      analyst: firstRoleActor(roles, peopleMap, 'ANALISTA'),
    };
  }, [headerRolesQuery.data, peopleMap]);

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

  const handleSelectSpeciesProduct = useCallback(
    (speciesProductId: string) => {
      storeActions.setSelectedSpeciesProductId(
        selectedSpeciesProductId === speciesProductId ? null : speciesProductId,
      );
    },
    [storeActions, selectedSpeciesProductId],
  );

  const handleCreditSort = useCallback(
    (field: AutefVolumeBalanceSortField) => {
      if (storeState.creditSortBy === field) {
        storeActions.setCreditSort(field, storeState.creditSortOrder === 'DESC' ? 'ASC' : 'DESC');
        return;
      }
      storeActions.setCreditSort(field, 'DESC');
    },
    [storeActions, storeState.creditSortBy, storeState.creditSortOrder],
  );

  const handleExportCredit = useCallback(async () => {
    if (!validId || isExportingCredit) return;
    setIsExportingCredit(true);
    setCreditExportError(null);
    try {
      await AutefsService.exportVolumeBalancesCsv(autefId, {
        sortBy: storeState.creditSortBy,
        sortOrder: storeState.creditSortOrder,
      });
    } catch {
      setCreditExportError('failed');
    } finally {
      setIsExportingCredit(false);
    }
  }, [
    autefId,
    isExportingCredit,
    storeState.creditSortBy,
    storeState.creditSortOrder,
    validId,
  ]);

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
      isLoadingSpecies: volumeBalancesQuery.isLoading || volumeBalancesQuery.isFetching,
      isExportingCredit,
      creditExportError,
      contributions: contributionsQuery.data ?? emptyContributions(),
      isLoadingContributions:
        contributionsQuery.isLoading || contributionsQuery.isFetching,
      forestGuides: forestGuidesQuery.data ?? emptyPagination(),
      isLoadingForestGuides: forestGuidesQuery.isLoading || forestGuidesQuery.isFetching,
      harvestUnits: harvestUnitsQuery.data ?? emptyPagination(),
      isLoadingHarvestUnits: harvestUnitsQuery.isLoading || harvestUnitsQuery.isFetching,
      roles: rolesQuery.data ?? emptyPagination(),
      isLoadingRoles: rolesQuery.isLoading || rolesQuery.isFetching,
      speciesProductsMap,
      peopleMap,
      dossierFlags,
      dossierActors,
      headerHarvestUnits: headerHarvestUnitsQuery.data?.data ?? [],
      forestGuideTotal: headerForestGuidesQuery.data?.total ?? 0,
      harvestUnitTotal: headerHarvestUnitsQuery.data?.total ?? 0,
      actorTotal: headerRolesQuery.data?.total ?? 0,
      isLoadingDossierMeta:
        headerBalancesQuery.isLoading ||
        headerRolesQuery.isLoading ||
        headerForestGuidesQuery.isLoading ||
        headerHarvestUnitsQuery.isLoading,
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
      handleSelectSpeciesProduct,
      handleCreditSort,
      handleExportCredit,
    },
  };
}

export type AutefDetailController = ReturnType<typeof useAutefDetailController>;
