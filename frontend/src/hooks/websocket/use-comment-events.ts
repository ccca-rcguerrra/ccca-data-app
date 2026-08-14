import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/websocket/use-websocket';
import {
  WS_EVENTS,
  type CommentCreatedPayload,
  type CommentDeletedPayload,
} from '@/services/websocket/websocket.events';
import { QUERY_KEYS } from '@/constants/query-keys.constants';

/**
 * useCommentEvents
 * Subscribes to a channel's comments room and invalidates its list cache when
 * a comment is created/deleted (by anyone). Room: `comments:<channel>`.
 */
export function useCommentEvents(channel: string | null) {
  const queryClient = useQueryClient();
  const { socket, emit } = useWebSocket();

  useEffect(() => {
    if (!channel || !socket) return;

    emit(WS_EVENTS.SUBSCRIBE_COMMENTS, { channel });

    const invalidate = (payload: CommentCreatedPayload | CommentDeletedPayload) => {
      if (payload.channel !== channel) return;
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.comments.list(channel) });
    };

    socket.on(WS_EVENTS.COMMENT_CREATED, invalidate);
    socket.on(WS_EVENTS.COMMENT_DELETED, invalidate);

    return () => {
      socket.off(WS_EVENTS.COMMENT_CREATED, invalidate);
      socket.off(WS_EVENTS.COMMENT_DELETED, invalidate);
      emit(WS_EVENTS.UNSUBSCRIBE_COMMENTS, { channel });
    };
  }, [channel, socket, emit, queryClient]);
}
