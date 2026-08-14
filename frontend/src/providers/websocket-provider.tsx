import { useWebSocket } from '@/hooks/websocket/use-websocket';
import { usePresenceEvents } from '@/hooks/websocket/use-presence-events';

/**
 * WebSocketProvider
 * Mounts the WebSocket connection for the app lifecycle.
 * Must be a child of QueryProvider (event hooks use useQueryClient).
 * Connection is managed by useWebSocket — connects on auth, disconnects on logout.
 * Global WS event hooks are registered here so they run after the socket is created.
 */
export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useWebSocket();
  usePresenceEvents();
  return <>{children}</>;
}
