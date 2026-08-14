import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WebsocketService } from '../websocket.service';
import {
  NOTIFICATION_EVENTS,
  NotificationCreatedEvent,
} from '../events/notification.events';

/**
 * NotificationListener
 * Bridges notification domain events to the recipient's user room (`user:<id>`).
 */
@Injectable()
export class NotificationListener {
  constructor(private readonly websocketService: WebsocketService) {}

  @OnEvent(NOTIFICATION_EVENTS.CREATED)
  onNotificationCreated(event: NotificationCreatedEvent): void {
    this.websocketService.emitToUser(event.userId, 'notification:created', event.notification);
  }
}
