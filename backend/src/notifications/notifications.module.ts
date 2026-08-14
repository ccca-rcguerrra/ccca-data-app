import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { MailModule } from '../mail/mail.module';

import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './notifications.controller';
import { CommentMentionListener } from './listeners/comment-mention.listener';

@Module({
  imports: [ModelModule, MailModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, CommentMentionListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
