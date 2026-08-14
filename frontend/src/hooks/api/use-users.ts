import { useMemo } from 'react';
import { useQueries, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UsersService } from '@/services/users/users.service';
import type { UsersListParams } from '@/types/users';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

/**
 * Hook to fetch currently online users.
 * Cache-first: long-lived cache; live updates come from WebSocket (usePresenceEvents).
 */
export const useOnlineUsersQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: QUERY_KEYS.users.online(),
    queryFn: () => UsersService.findOnline(),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: options?.enabled !== false,
  });
};

/**
 * Hook to fetch paginated users
 */
export const useUsersQuery = (
  params: UsersListParams = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: QUERY_KEYS.users.list(params),
    queryFn: () => UsersService.findAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false,
  });
};

/**
 * Hook to fetch a single user by ID
 */
export const useUserQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.users.detail(id),
    queryFn: () => UsersService.findOne(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to fetch multiple users by ids (parallel queries).
 * Returns a map keyed by user id for easy lookup in UI components.
 */
export const useUsersByIdsMap = (ids: number[]) => {
  const uniqueIds = useMemo(
    () => Array.from(new Set(ids.filter((id) => Number.isInteger(id) && id > 0))),
    [ids]
  );

  const userQueries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: QUERY_KEYS.users.detail(id),
      queryFn: () => UsersService.findOne(id),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    })),
  });

  return useMemo(() => {
    const map: Record<number, { name: string; email: string }> = {};
    userQueries.forEach((query, index) => {
      const user = query.data;
      const id = uniqueIds[index];
      if (!user || !id) return;
      map[id] = { name: user.name, email: user.email };
    });
    return map;
  }, [userQueries, uniqueIds]);
};

/**
 * Hook to delete a user
 */
export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => UsersService.remove(id),
    onSuccess: (_, deletedId) => {
      // Remove the user from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.users.detail(deletedId) });

      // Invalidate all lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users.lists() });
    },
    onError: (error) => {
      console.error('Error deleting user:', error);
    },
  });
};

/**
 * Hook to prefetch user for better UX
 */
export const usePrefetchUser = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.users.detail(id),
      queryFn: () => UsersService.findOne(id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
};

/**
 * Main hook that provides all user-related queries and mutations
 * Maintains consistency with other hooks pattern
 */
export function useUsers() {
  const usersQuery = useUsersQuery();
  const deleteUserMutation = useDeleteUserMutation();

  return {
    // Query state
    users: usersQuery.data?.data ?? [],
    pagination: usersQuery.data
      ? {
          page: usersQuery.data.page,
          limit: usersQuery.data.limit,
          total: usersQuery.data.total,
          totalPages: usersQuery.data.totalPages,
          hasNext: usersQuery.data.hasNext,
          hasPrev: usersQuery.data.hasPrev,
        }
      : null,
    isLoading: usersQuery.isLoading,
    isError: usersQuery.isError,
    error: usersQuery.error,
    refetch: usersQuery.refetch,

    // Mutations
    deleteUser: deleteUserMutation.mutateAsync,
    isDeleting: deleteUserMutation.isPending,
  };
}
