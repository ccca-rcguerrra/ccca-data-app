import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Notification, NotificationData } from '../../model/entities/notification.entity';
import { NotificationType } from '../../model/model.enums';
import { GetNotificationsQueryDto } from '../dto/get-notifications-query.dto';
import { GetNotificationsResponseDto } from '../dto/get-notifications-response.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import {
  NOTIFICATION_EVENTS,
  NotificationCreatedEvent,
} from '../../websocket/events/notification.events';

export interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Persists a notification and emits a real-time event to the recipient.
   */
  async create(params: CreateNotificationParams): Promise<Notification> {
    const notification = await this.notificationRepository.save(
      this.notificationRepository.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        data: params.data ?? {},
      }),
    );

    this.eventEmitter.emit(NOTIFICATION_EVENTS.CREATED, {
      userId: params.userId,
      notification,
    } as NotificationCreatedEvent);

    return notification;
  }

  async findByUser(
    userId: number,
    queryDto: GetNotificationsQueryDto,
  ): Promise<GetNotificationsResponseDto> {
    const { page = 1, limit = 20, unreadOnly = false } = queryDto;
    const skip = (page - 1) * limit;

    const qb = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (unreadOnly) {
      qb.andWhere('notification.readAt IS NULL');
    }

    const [notifications, total] = await qb
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const unreadCount = await this.unreadCount(userId);
    const data = notifications.map((n) => new NotificationResponseDto(n));
    return new GetNotificationsResponseDto(data, page, limit, total, unreadCount);
  }

  unreadCount(userId: number): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, readAt: IsNull() },
    });
  }

  async markRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    if (notification.readAt) return;
    await this.notificationRepository.update({ id, userId }, { readAt: new Date() });
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, readAt: IsNull() },
      { readAt: new Date() },
    );
  }
}
