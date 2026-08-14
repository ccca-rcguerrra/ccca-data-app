import type { ApiPaginatedResponse } from '@/types/api';
import type { Comment, CommentsListParams, CreateCommentPayload } from '@/types/comments';

import { api } from '@/services/api';

/**
 * Comments service — generic comments addressed by channel (e.g. "alert:123").
 */
export class CommentsService {
  private static readonly BASE_URL = '/api/comments';

  /**
   * Get paginated comments for a channel (GET /api/comments?channel=...)
   */
  static async findByChannel(
    params: CommentsListParams,
  ): Promise<ApiPaginatedResponse<Comment>> {
    const { channel, page = 1, limit = 20 } = params;
    const response = await api.get<ApiPaginatedResponse<Comment>>(CommentsService.BASE_URL, {
      params: { channel, page, limit },
    });
    return response.data;
  }

  /**
   * Create a comment (POST /api/comments)
   */
  static async create(payload: CreateCommentPayload): Promise<Comment> {
    const response = await api.post<{ data: Comment } | Comment>(
      CommentsService.BASE_URL,
      payload,
    );
    // Controller returns the DTO directly; tolerate both shapes.
    const data = response.data as { data?: Comment } & Comment;
    return data.data ?? data;
  }

  /**
   * Delete a comment (DELETE /api/comments/:id)
   */
  static async remove(id: number): Promise<void> {
    await api.delete(`${CommentsService.BASE_URL}/${id}`);
  }
}
