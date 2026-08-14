import { useCallback, useEffect, useMemo } from 'react';

import { useUsersQuery, usePrefetchUser, useDeleteUserMutation } from '@/hooks/api/use-users';
import { useTeamsQuery } from '@/hooks/api/use-teams';

import {
  useUsersManagementState,
  useUsersManagementActions,
  type UsersManagementFilters,
} from '../store/use-users-management-store';
import {
  convertUserToRowData,
  type UserRowData,
} from '../types';

/**
 * useUsersManagementController
 * Orchestrates users list (React Query), store (Zustand), and handlers.
 * Follows ARCHITECTURE_GUIDE: controller returns { api, store, handlers }.
 */
export function useUsersManagementController() {
  const storeState = useUsersManagementState();
  const storeActions = useUsersManagementActions();

  const usersListParams = useMemo(
    () => ({
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: storeState.searchQuery.trim() || undefined,
      teamId:
        storeState.filters.teams.length > 0 ? storeState.filters.teams : undefined,
    }),
    [
      storeState.currentPage,
      storeState.pageSize,
      storeState.searchQuery,
      storeState.filters.teams,
    ]
  );

  const usersQuery = useUsersQuery(usersListParams);
  const teamsQuery = useTeamsQuery({ limit: 100 });
  const prefetchUser = usePrefetchUser();
  const deleteUserMutation = useDeleteUserMutation();

  const teamOptions = useMemo(() => {
    if (!teamsQuery.data?.data) return [];
    return teamsQuery.data.data
      .map((team) => ({ id: team.id, name: team.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teamsQuery.data]);

  const teamIdToNameMap = useMemo(() => {
    if (!teamsQuery.data?.data) return new Map<number, string>();
    return new Map(teamsQuery.data.data.map((team) => [team.id, team.name]));
  }, [teamsQuery.data]);

  const teamNameToIdMap = useMemo(() => {
    if (!teamsQuery.data?.data) return new Map<string, number>();
    return new Map(teamsQuery.data.data.map((team) => [team.name, team.id]));
  }, [teamsQuery.data]);

  const selectedTeamNames = useMemo(
    () =>
      storeState.filters.teams
        .map((id) => teamIdToNameMap.get(id))
        .filter((name): name is string => name !== undefined),
    [storeState.filters.teams, teamIdToNameMap]
  );

  const teamNamesOptions = useMemo(
    () => teamOptions.map((t) => t.name),
    [teamOptions]
  );

  const apiUsers: UserRowData[] = useMemo(() => {
    if (!usersQuery.data?.data) return [];
    return usersQuery.data.data.map(convertUserToRowData);
  }, [usersQuery.data]);

  const filteredUsers = useMemo(
    () =>
      apiUsers.filter((user) => {
        const matchesBiome =
          storeState.filters.biomes.length === 0 ||
          storeState.filters.biomes.some((b) => user.biomes.includes(b));
        const matchesProfile =
          storeState.filters.profile === 'all' ||
          user.roles.includes(storeState.filters.profile as import('@/types/users').UserRole);
        const matchesStatus =
          storeState.filters.status === 'all' || user.status === storeState.filters.status;
        const matchesInstitution =
          storeState.filters.institution === '' ||
          user.institution === storeState.filters.institution;
        return matchesBiome && matchesProfile && matchesStatus && matchesInstitution;
      }),
    [apiUsers, storeState.filters]
  );

  const sortedUsers = useMemo(() => {
    const data = [...filteredUsers];
    const direction = storeState.sortDir === 'asc' ? 1 : -1;
    data.sort((a, b) => {
      switch (storeState.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'profile':
          return (a.roles[0] ?? '').localeCompare(b.roles[0] ?? '') * direction;
        case 'createdAt':
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            direction
          );
        case 'lastLogin':
          return (
            (new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime()) *
            direction
          );
        default:
          return 0;
      }
    });
    return data;
  }, [filteredUsers, storeState.sortBy, storeState.sortDir]);

  const pagination = usersQuery.data
    ? {
        page: usersQuery.data.page,
        limit: usersQuery.data.limit,
        total: usersQuery.data.total,
        totalPages: usersQuery.data.totalPages,
        hasNext: usersQuery.data.hasNext,
        hasPrev: usersQuery.data.hasPrev,
      }
    : null;

  const hasActiveFilters = useMemo(
    () =>
      storeState.filters.biomes.length > 0 ||
      storeState.filters.profile !== 'all' ||
      storeState.filters.status !== 'all' ||
      storeState.filters.institution !== '',
    [storeState.filters]
  );

  const shouldUseApiPagination = Boolean(pagination && !hasActiveFilters);

  const totalPages = shouldUseApiPagination
    ? (pagination?.totalPages ?? 1)
    : Math.max(1, Math.ceil(sortedUsers.length / storeState.pageSize));

  const paginatedUsers = useMemo(() => {
    if (shouldUseApiPagination) return apiUsers;
    const start = (storeState.currentPage - 1) * storeState.pageSize;
    return sortedUsers.slice(start, start + storeState.pageSize);
  }, [
    apiUsers,
    sortedUsers,
    storeState.currentPage,
    storeState.pageSize,
    shouldUseApiPagination,
  ]);

  useEffect(() => {
    return () => {
      storeActions.reset();
    };
  }, [storeActions]);

  const handleSearchQueryChange = useCallback(
    (query: string) => {
      storeActions.setSearchQuery(query);
    },
    [storeActions]
  );

  const handleTeamFilterChange = useCallback(
    (teamNames: string[]) => {
      const teamIds = teamNames
        .map((name) => teamNameToIdMap.get(name))
        .filter((id): id is number => id !== undefined);
      storeActions.setFilters({ teams: teamIds });
    },
    [storeActions, teamNameToIdMap]
  );

  const handleClearFilters = useCallback(() => {
    storeActions.clearFilters();
  }, [storeActions]);

  const handlePageSizeChange = useCallback(
    (size: number) => {
      storeActions.setPageSize(size);
    },
    [storeActions]
  );

  const handleToggleRow = useCallback(
    (userId: string) => {
      storeActions.toggleUserSelection(userId);
    },
    [storeActions]
  );

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      const userIds = paginatedUsers.map((u) => u.id);
      if (checked) {
        storeActions.toggleSelectAll(userIds);
      } else {
        userIds.forEach((id) => {
          if (storeState.selectedUserIds.has(id)) {
            storeActions.toggleUserSelection(id);
          }
        });
      }
    },
    [paginatedUsers, storeState.selectedUserIds, storeActions]
  );

  const handleUserHover = useCallback(
    (userId: string) => {
      const numId = Number(userId);
      if (!Number.isNaN(numId)) prefetchUser(numId);
    },
    [prefetchUser]
  );

  const removeUser = useCallback(
    (userId: number) => deleteUserMutation.mutateAsync(userId),
    [deleteUserMutation]
  );

  return {
    api: {
      users: apiUsers,
      paginatedUsers,
      sortedUsers,
      pagination,
      isLoading: usersQuery.isLoading,
      isError: usersQuery.isError,
      error: usersQuery.error,
      refetch: usersQuery.refetch,
      teamOptions,
      teamIdToNameMap,
      teamNameToIdMap,
      selectedTeamNames,
      teamNamesOptions,
      isLoadingTeams: teamsQuery.isLoading,
      hasActiveFilters,
      shouldUseApiPagination,
      totalPages,
      isRemoving: deleteUserMutation.isPending,
    },
    store: {
      state: storeState,
      actions: storeActions,
    },
    handlers: {
      handleSearchQueryChange,
      handleTeamFilterChange,
      handleClearFilters,
      handlePageSizeChange,
      handleToggleRow,
      handleToggleSelectAll,
      handleUserHover,
      goToNextPage: storeActions.goToNextPage,
      goToPreviousPage: storeActions.goToPreviousPage,
      clearSelection: storeActions.clearSelection,
      openUserModalCreate: storeActions.openUserModalCreate,
      openUserModalEdit: storeActions.openUserModalEdit,
      closeUserModal: storeActions.closeUserModal,
      removeUser,
    },
  };
}

export type UsersManagementController = ReturnType<typeof useUsersManagementController>;
