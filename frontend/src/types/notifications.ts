/**
 * Notifications domain types — mirrors backend NotificationResponseDto.
 */

export type NotificationType = 'comment_mention';

export interface NotificationData {
  channel?: string;
  commentId?: number;
  resourceId?: number;
  actorId?: number;
  actorName?: string;
  [key: string]: unknown;
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}
