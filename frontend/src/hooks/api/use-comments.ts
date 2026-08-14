import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { CommentsService } from '@/services/comments/comments.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

/**
 * Hook to fetch comments of a channel (paginated; first page only by default).
 */
export const useCommentsQuery = (channel: string | null, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments.list(channel ?? ''),
    queryFn: () => CommentsService.findByChannel({ channel: channel as string, limit: 100 }),
    enabled: enabled && !!channel,
    staleTime: 1000 * 30, // 30s
    gcTime: 1000 * 60 * 5,
  });
};

interface CreateCommentVars {
  content: string;
  mentionedUserIds?: number[];
}

/**
 * Hook to create a comment on a channel. Invalidates that channel's list.
 */
export const useCreateCommentMutation = (channel: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, mentionedUserIds }: CreateCommentVars) =>
      CommentsService.create({ channel: channel as string, content, mentionedUserIds }),
    onSuccess: () => {
      if (channel) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments.list(channel) });
      }
    },
  });
};

/**
 * Hook to delete a comment from a channel. Invalidates that channel's list.
 */
export const useDeleteCommentMutation = (channel: string | null) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => CommentsService.remove(id),
    onSuccess: () => {
      if (channel) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments.list(channel) });
      }
    },
  });
};
