import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useWebSocket } from '@/hooks/websocket/use-websocket';
import {
  WS_EVENTS,
  type NotificationCreatedPayload,
} from '@/services/websocket/websocket.events';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

export function useNotificationEvents() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const handleCreated = (payload: NotificationCreatedPayload) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.notifications.all(),
      });

      toast(payload.title, {
        description: payload.body,
      });
    };

    socket.on(WS_EVENTS.NOTIFICATION_CREATED, handleCreated);
    return () => {
      socket.off(WS_EVENTS.NOTIFICATION_CREATED, handleCreated);
    };
  }, [socket, queryClient, t]);
}
