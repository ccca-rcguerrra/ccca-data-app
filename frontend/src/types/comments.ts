/**
 * Comments domain types — mirrors backend CommentResponseDto.
 * Comments are generic and addressed by `channel` (e.g. "alert:123").
 */

export interface CommentAuthor {
  id: number;
  name: string;
  email: string;
  photo: string | null;
}

export interface Comment {
  id: number;
  channel: string;
  content: string;
  mentionedUserIds: number[];
  author: CommentAuthor;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface CommentsListParams {
  channel: string;
  page?: number;
  limit?: number;
}

export interface CreateCommentPayload {
  channel: string;
  content: string;
  mentionedUserIds?: number[];
}

/**
 * Builds the channel string for an alert's comment thread.
 * Single thread per alert, shared across all alert screens.
 */
export const commentChannel = (entity: string, id: number): string =>
  `${entity}:${id}`;
