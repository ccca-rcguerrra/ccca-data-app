import type { Notification } from '../../model/entities/notification.entity';

export const NOTIFICATION_EVENTS = {
  CREATED: 'notification.created',
} as const;

export class NotificationCreatedEvent {
  userId: number;
  notification: Notification;
}
