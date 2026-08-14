import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../../model/entities/user.entity';
import { NotificationType } from '../../model/model.enums';
import { NotificationsService } from '../services/notifications.service';
import { MailService } from '../../mail/mail.service';
import {
  COMMENT_EVENTS,
  CommentMentionedEvent,
} from '../../websocket/events/comment.events';

/**
 * Reacts to comment mentions: persists an in-app notification and sends an
 * email to each mentioned user. Runs out of the request lifecycle (event-based).
 */
@Injectable()
export class CommentMentionListener {
  private readonly logger = new Logger(CommentMentionListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent(COMMENT_EVENTS.MENTIONED)
  async onCommentMentioned(event: CommentMentionedEvent): Promise<void> {
    const recipientIds = (event.mentionedUserIds ?? []).filter((id) => id !== event.actorId);
    if (recipientIds.length === 0) return;

    const users = await this.userRepository.find({ where: { id: In(recipientIds) } });

    const title = `${event.actorName} mencionou você em um comentário`;
    const body = event.preview;

    await Promise.all(
      users.map(async (user) => {
        try {
          await this.notificationsService.create({
            userId: user.id,
            type: NotificationType.COMMENT_MENTION,
            title,
            body,
            data: {
              channel: event.channel,
              commentId: event.commentId,
            resourceId: event.resourceId,
              actorId: event.actorId,
              actorName: event.actorName,
            },
          });
        } catch (err) {
          this.logger.error(`Failed to create mention notification for user ${user.id}`, err as Error);
        }

        try {
          await this.mailService.sendMentionEmail({
            to: user.email,
            name: user.name,
            actorName: event.actorName,
            preview: event.preview,
            resourceId: event.resourceId,
          });
        } catch (err) {
          this.logger.error(`Failed to send mention email to ${user.email}`, err as Error);
        }
      }),
    );
  }
}
