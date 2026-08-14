import { ApiProperty } from '@nestjs/swagger';
import type { Notification, NotificationData } from '../../model/entities/notification.entity';
import { NotificationType } from '../../model/model.enums';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID', example: 1, type: Number })
  id: number;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  type: NotificationType;

  @ApiProperty({ description: 'Short title', example: 'Você foi mencionado', type: String })
  title: string;

  @ApiProperty({ description: 'Body text', type: String })
  body: string;

  @ApiProperty({ description: 'Type-specific payload', type: Object })
  data: NotificationData;

  @ApiProperty({ description: 'Read timestamp (null when unread)', type: Date, nullable: true })
  readAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  createdAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.type = notification.type;
    this.title = notification.title;
    this.body = notification.body;
    this.data = notification.data ?? {};
    this.readAt = notification.readAt;
    this.createdAt = notification.createdAt;
  }
}
