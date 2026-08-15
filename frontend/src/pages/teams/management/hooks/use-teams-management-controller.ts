import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useTeamsQuery } from '@/hooks/api/use-teams';
import { useTerritoriesQuery } from '@/hooks/api/use-territories';
import { useTerritoryFilters } from '@/hooks/api/use-app-config';

import {
  useTeamsManagementState,
  useTeamsManagementActions,
  type TeamsManagementFilters,
} from '../store/use-teams-management-store';
import {
  convertTeamToRowData,
  BIOME_OPTIONS,
  INSTITUTION_OPTIONS,
} from '../types';
import type { TeamRowData } from '../types';

/**
 * useTeamsManagementController
 * Orchestrates teams list (React Query), store (Zustand), and handlers.
 * Same pattern as use-users-management-controller.
 */
export function useTeamsManagementController() {
  const { t } = useTranslation();
  const storeState = useTeamsManagementState();
  const storeActions = useTeamsManagementActions();

  const listParams = useMemo(
    () => ({
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: storeState.searchQuery.trim() || undefined,
    }),
    [storeState.currentPage, storeState.pageSize, storeState.searchQuery]
  );

  const { teamFilters } = useTerritoryFilters();
  const teamsQuery = useTeamsQuery(listParams);
  const territoriesQuery = useTerritoriesQuery({
    page: 1,
    limit: 100,
    category: teamFilters,
  });

  const territoryNamesById = useMemo(() => {
    const map = new Map<number, string>();
    const raw = territoriesQuery.data?.data;
    if (!Array.isArray(raw)) return map;
    for (const territory of raw) {
      if (territory.name) map.set(territory.id, territory.name);
    }
    return map;
  }, [territoriesQuery.data]);

  const apiTeams: TeamRowData[] = useMemo(() => {
    if (!teamsQuery.data?.data) return [];
    return teamsQuery.data.data.map((team) =>
      convertTeamToRowData(team, territoryNamesById, t),
    );
  }, [teamsQuery.data, territoryNamesById, t]);

  const filteredTeams = useMemo(
    () =>
      apiTeams.filter((team) => {
        const matchesBiomes =
          storeState.filters.biomes.length === 0 ||
          storeState.filters.biomes.every((b) => team.biomes.includes(b));
        const matchesInstitution =
          storeState.filters.institution === 'all' ||
          team.institution === storeState.filters.institution;
        const matchesStatus =
          storeState.filters.status === 'all' || team.status === storeState.filters.status;
        return matchesBiomes && matchesInstitution && matchesStatus;
      }),
    [apiTeams, storeState.filters]
  );

  const sortedTeams = useMemo(() => {
    const data = [...filteredTeams];
    const direction = storeState.sortDir === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      switch (storeState.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'institution':
          return a.institution.localeCompare(b.institution) * direction;
        case 'lastUpdated':
          return (
            (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * direction
          );
        case 'usersCount':
          return (a.usersCount - b.usersCount) * direction;
        default:
          return 0;
      }
    });
    return data;
  }, [filteredTeams, storeState.sortBy, storeState.sortDir]);

  const pagination = teamsQuery.data
    ? {
        page: teamsQuery.data.page,
        limit: teamsQuery.data.limit,
        total: teamsQuery.data.total,
        totalPages: teamsQuery.data.totalPages,
        hasNext: teamsQuery.data.hasNext,
        hasPrev: teamsQuery.data.hasPrev,
      }
    : null;

  const hasActiveFilters = useMemo(
    () =>
      storeState.filters.biomes.length > 0 ||
      storeState.filters.institution !== 'all' ||
      storeState.filters.status !== 'all',
    [storeState.filters]
  );

  const shouldUseApiPagination = Boolean(pagination && !hasActiveFilters);

  const totalPages = shouldUseApiPagination
    ? (pagination?.totalPages ?? 1)
    : Math.max(1, Math.ceil(sortedTeams.length / storeState.pageSize));

  const paginatedTeams = useMemo(() => {
    if (shouldUseApiPagination) return apiTeams;
    const start = (storeState.currentPage - 1) * storeState.pageSize;
    return sortedTeams.slice(start, start + storeState.pageSize);
  }, [
    apiTeams,
    sortedTeams,
    storeState.currentPage,
    storeState.pageSize,
    shouldUseApiPagination,
  ]);

  useEffect(() => {
    return () => storeActions.reset();
  }, [storeActions]);

  const handleSearchQueryChange = useCallback(
    (query: string) => storeActions.setSearchQuery(query),
    [storeActions]
  );

  const handleBiomesFilterChange = useCallback(
    (biomes: string[]) => storeActions.setFilters({ biomes }),
    [storeActions]
  );

  const handleInstitutionFilterChange = useCallback(
    (institution: string) => storeActions.setFilters({ institution }),
    [storeActions]
  );

  const handleStatusFilterChange = useCallback(
    (status: string) => storeActions.setFilters({ status }),
    [storeActions]
  );

  const handleClearFilters = useCallback(() => storeActions.clearFilters(), [storeActions]);

  const handlePageSizeChange = useCallback(
    (size: number) => storeActions.setPageSize(size),
    [storeActions]
  );

  const handlePageChange = useCallback(
    (page: number) => storeActions.setPage(page),
    [storeActions]
  );

  return {
    api: {
      teams: apiTeams,
      paginatedTeams,
      sortedTeams,
      pagination,
      isLoading: teamsQuery.isLoading,
      isError: teamsQuery.isError,
      error: teamsQuery.error,
      refetch: teamsQuery.refetch,
      hasActiveFilters,
      shouldUseApiPagination,
      totalPages,
      biomeOptions: BIOME_OPTIONS,
      institutionOptions: INSTITUTION_OPTIONS,
    },
    store: {
      state: storeState,
      actions: storeActions,
    },
    handlers: {
      handleSearchQueryChange,
      handleBiomesFilterChange,
      handleInstitutionFilterChange,
      handleStatusFilterChange,
      handleClearFilters,
      handlePageSizeChange,
      handlePageChange,
      goToNextPage: storeActions.goToNextPage,
      goToPreviousPage: storeActions.goToPreviousPage,
      openTeamModalCreate: storeActions.openTeamModalCreate,
      openTeamModalEdit: storeActions.openTeamModalEdit,
      closeTeamModal: storeActions.closeTeamModal,
    },
  };
}

export type TeamsManagementController = ReturnType<typeof useTeamsManagementController>;
