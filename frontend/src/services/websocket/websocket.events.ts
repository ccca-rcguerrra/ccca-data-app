export const WS_EVENTS = {
  COMMENT_CREATED: 'comment:created',
  COMMENT_DELETED: 'comment:deleted',
  NOTIFICATION_CREATED: 'notification:created',
  USER_PRESENCE: 'user:presence',
  EXCEPTION: 'exception',
  SUBSCRIBE_ROOM: 'subscribe:room',
  UNSUBSCRIBE_ROOM: 'unsubscribe:room',
  SUBSCRIBE_COMMENTS: 'subscribe:comments',
  UNSUBSCRIBE_COMMENTS: 'unsubscribe:comments',
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

export interface CommentCreatedPayload {
  channel: string;
  commentId: number;
}

export interface CommentDeletedPayload {
  channel: string;
  commentId: number;
}

export interface NotificationCreatedPayload {
  id: number;
  type: string;
  title: string;
  body: string;
  data: {
    channel?: string;
    commentId?: number;
    resourceId?: number;
    actorId?: number;
    actorName?: string;
  };
  readAt: string | null;
  createdAt: string;
}

export interface WsExceptionPayload {
  message: string;
}

export interface UserPresencePayload {
  data: Array<{
    id: number;
    name: string;
    email: string;
    photo: string | null;
  }>;
  total: number;
}
