import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification-response.dto';

export class GetNotificationsResponseDto {
  @ApiProperty({ description: 'Array of notifications', type: [NotificationResponseDto] })
  data: NotificationResponseDto[];

  @ApiProperty({ description: 'Count of unread notifications for the user', example: 3, type: Number })
  unreadCount: number;

  @ApiProperty({ description: 'Current page number', example: 1, type: Number })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: 20, type: Number })
  limit: number;

  @ApiProperty({ description: 'Total number of items', example: 42, type: Number })
  total: number;

  @ApiProperty({ description: 'Total number of pages', example: 3, type: Number })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true, type: Boolean })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false, type: Boolean })
  hasPrev: boolean;

  constructor(
    data: NotificationResponseDto[],
    page: number,
    limit: number,
    total: number,
    unreadCount: number,
  ) {
    this.data = data;
    this.page = page;
    this.limit = limit;
    this.total = total;
    this.unreadCount = unreadCount;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}

export class UnreadCountResponseDto {
  @ApiProperty({ description: 'Count of unread notifications', example: 3, type: Number })
  unreadCount: number;

  constructor(unreadCount: number) {
    this.unreadCount = unreadCount;
  }
}
