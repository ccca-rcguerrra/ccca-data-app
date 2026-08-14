import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { WS_EVENTS, type WsEventName } from '@/services/websocket/websocket.events';

export type WsConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Module-level singleton — shared across all hook calls, persists across re-renders
let _socket: Socket | null = null;

const WS_URL = import.meta.env.VITE_WS_URL ?? import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * useWebSocket
 * Manages the Socket.io connection lifecycle and exposes the socket instance.
 * All transport logic lives here — no external service class.
 * Event hooks depend on this hook; none of them access the socket directly.
 */
export function useWebSocket() {
  const token = useAuthStore((s) => s.tokens?.accessToken ?? null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback((authToken: string): Socket => {
    // Reuse if already connected or actively connecting (not manually disconnected).
    // Avoids destroying a socket mid-handshake in React StrictMode double-invoke.
    if (_socket && !_socket.disconnected) return _socket;

    // Clean up a stale manually-disconnected socket before creating a new one
    _socket?.disconnect();

    _socket = io(WS_URL, {
      auth: { token: authToken },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    if (import.meta.env.DEV) {
      _socket.onAny((event: string, ...args: unknown[]) => {
        console.log(`[WS] ${event}`, args.length === 1 ? args[0] : args);
      });
    }

    return _socket;
  }, []);

  const disconnect = useCallback((): void => {
    _socket?.disconnect();
    _socket = null;
  }, []);

  const emit = useCallback((event: WsEventName, payload?: unknown): void => {
    _socket?.emit(event, payload);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      disconnect();
      socketRef.current = null;
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    const socket = connect(token);
    socketRef.current = socket;

    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onConnectError = () => setStatus('error');
    const onException = () => {
      setStatus('error');
      disconnect();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(WS_EVENTS.EXCEPTION, onException);

    // Sync initial state
    if (socket.connected) setStatus('connected');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(WS_EVENTS.EXCEPTION, onException);
    };
  }, [isAuthenticated, token, connect, disconnect]);

  return {
    socket: socketRef.current,
    emit,
    status,
    isConnected: status === 'connected',
  };
}
