import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebsocketService } from '../websocket.service';
import {
  COMMENT_EVENTS,
  CommentCreatedEvent,
  CommentDeletedEvent,
} from '../events/comment.events';

/**
 * CommentListener
 * Bridges domain comment events (EventEmitter) to the WebSocket room of the
 * channel. Room name is `comments:<channel>` — kept independent from the
 * `alert:<id>` room used by the viewers/presence feature.
 */
@Injectable()
export class CommentListener {
  constructor(private readonly websocketService: WebsocketService) {}

  @OnEvent(COMMENT_EVENTS.CREATED)
  onCommentCreated(event: CommentCreatedEvent): void {
    this.websocketService.emitToRoom(`comments:${event.channel}`, 'comment:created', {
      channel: event.channel,
      commentId: event.commentId,
    });
  }

  @OnEvent(COMMENT_EVENTS.DELETED)
  onCommentDeleted(event: CommentDeletedEvent): void {
    this.websocketService.emitToRoom(`comments:${event.channel}`, 'comment:deleted', {
      channel: event.channel,
      commentId: event.commentId,
    });
  }
}
