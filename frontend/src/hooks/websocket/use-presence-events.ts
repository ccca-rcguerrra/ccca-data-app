import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/websocket/use-websocket';
import { WS_EVENTS, type UserPresencePayload } from '@/services/websocket/websocket.events';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import type { OnlineUser } from '@/types/users';

/**
 * usePresenceEvents
 * Keeps the online users cache in sync with user:presence WebSocket events.
 * The initial fetch is handled separately by useOnlineUsersQuery.
 */
export function usePresenceEvents() {
  const queryClient = useQueryClient();
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const handlePresence = (payload: UserPresencePayload) => {
      queryClient.setQueryData<OnlineUser[]>(QUERY_KEYS.users.online(), payload.data);
    };

    const attach = () => socket.on(WS_EVENTS.USER_PRESENCE, handlePresence);

    if (socket.connected) {
      attach();
    } else {
      socket.once('connect', attach);
    }

    return () => {
      socket.off('connect', attach);
      socket.off(WS_EVENTS.USER_PRESENCE, handlePresence);
    };
  }, [socket, queryClient]);
}
