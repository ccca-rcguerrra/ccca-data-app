import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { NotificationsService } from '@/services/notifications/notifications.service';
import type { NotificationsListParams } from '@/types/notifications';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

/**
 * Hook to fetch the current user's notifications (paginated, with unread count).
 */
export const useNotificationsQuery = (
  params: NotificationsListParams = {},
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.list(params),
    queryFn: () => NotificationsService.findAll(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    enabled: options?.enabled !== false,
  });
};

/**
 * Hook to fetch the unread notifications count (kept fresh by WS invalidation).
 */
export const useUnreadCountQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.notifications.unreadCount(),
    queryFn: () => NotificationsService.unreadCount(),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => NotificationsService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all() });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => NotificationsService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notifications.all() });
    },
  });
};
