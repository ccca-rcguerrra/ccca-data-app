import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TeamsService } from '@/services/teams/teams.service';
import type { TeamsListParams, CreateTeam, UpdateTeam } from '@/types/teams';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

/**
 * Hook to fetch paginated teams
 */
export const useTeamsQuery = (
  params: TeamsListParams = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: QUERY_KEYS.teams.list(params),
    queryFn: () => TeamsService.findAll(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false,
  });
};

/**
 * Hook to fetch a single team by ID
 */
export const useTeamQuery = (id: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.teams.detail(id),
    queryFn: () => TeamsService.findOne(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
};

/**
 * Hook to create a new team
 */
export const useCreateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (team: CreateTeam) => TeamsService.create(team),
    onSuccess: () => {
      // Invalidate teams list to refetch with new team
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.lists() });
    },
    onError: (error) => {
      console.error('Error creating team:', error);
    },
  });
};

/**
 * Hook to update a team
 */
export const useUpdateTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, team }: { id: number; team: UpdateTeam }) =>
      TeamsService.update(id, team),
    onSuccess: (data) => {
      // Invalidate teams list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.lists() });
      // Invalidate specific team detail
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.detail(data.id) });
    },
    onError: (error) => {
      console.error('Error updating team:', error);
    },
  });
};

/**
 * Hook to delete a team
 */
export const useDeleteTeamMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => TeamsService.remove(id),
    onSuccess: (_, deletedId) => {
      // Remove the team from cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.teams.detail(deletedId) });

      // Invalidate all lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.teams.lists() });
    },
    onError: (error) => {
      console.error('Error deleting team:', error);
    },
  });
};

/**
 * Hook to prefetch team for better UX
 */
export const usePrefetchTeam = () => {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.teams.detail(id),
      queryFn: () => TeamsService.findOne(id),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };
};

/**
 * Main hook that provides all team-related queries and mutations
 * Maintains consistency with other hooks pattern
 */
export function useTeams() {
  const teamsQuery = useTeamsQuery();
  const deleteTeamMutation = useDeleteTeamMutation();

  return {
    // Query state
    teams: teamsQuery.data?.data ?? [],
    pagination: teamsQuery.data
      ? {
          page: teamsQuery.data.page,
          limit: teamsQuery.data.limit,
          total: teamsQuery.data.total,
          totalPages: teamsQuery.data.totalPages,
          hasNext: teamsQuery.data.hasNext,
          hasPrev: teamsQuery.data.hasPrev,
        }
      : null,
    isLoading: teamsQuery.isLoading,
    isError: teamsQuery.isError,
    error: teamsQuery.error,
    refetch: teamsQuery.refetch,

    // Mutations
    deleteTeam: deleteTeamMutation.mutateAsync,
    isDeleting: deleteTeamMutation.isPending,
  };
}
