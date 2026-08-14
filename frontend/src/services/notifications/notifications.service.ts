import type { ApiPaginatedResponse } from '@/types/api';
import type { AppNotification, NotificationsListParams } from '@/types/notifications';

import { api } from '@/services/api';

/** Paginated notifications response also carries the unread count. */
export interface NotificationsResponse extends ApiPaginatedResponse<AppNotification> {
  unreadCount: number;
}

/**
 * Notifications service — current user's in-app notifications.
 */
export class NotificationsService {
  private static readonly BASE_URL = '/api/notifications';

  static async findAll(params: NotificationsListParams = {}): Promise<NotificationsResponse> {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const response = await api.get<NotificationsResponse>(NotificationsService.BASE_URL, {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  }

  static async unreadCount(): Promise<number> {
    const response = await api.get<{ unreadCount: number }>(
      `${NotificationsService.BASE_URL}/unread-count`,
    );
    return response.data.unreadCount;
  }

  static async markRead(id: number): Promise<void> {
    await api.patch(`${NotificationsService.BASE_URL}/${id}/read`);
  }

  static async markAllRead(): Promise<void> {
    await api.patch(`${NotificationsService.BASE_URL}/read-all`);
  }
}
