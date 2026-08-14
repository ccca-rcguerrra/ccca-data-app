export const COMMENT_EVENTS = {
  CREATED: 'comment.created',
  DELETED: 'comment.deleted',
  MENTIONED: 'comment.mentioned',
} as const;

export class CommentCreatedEvent {
  channel: string;
  commentId: number;
  userId: number;
}

export class CommentDeletedEvent {
  channel: string;
  commentId: number;
  userId: number;
}

export class CommentMentionedEvent {
  channel: string;
  commentId: number;
  resourceId?: number;
  actorId: number;
  actorName: string;
  mentionedUserIds: number[];
  preview: string;
}
