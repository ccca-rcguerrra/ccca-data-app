import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Request,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './services/notifications.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import {
  GetNotificationsResponseDto,
  UnreadCountResponseDto,
} from './dto/get-notifications-response.dto';

@ApiTags('notifications')
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description: 'Returns a paginated list of the current user notifications plus the unread count.',
  })
  @ApiOkResponse({ description: 'Notifications returned successfully', type: GetNotificationsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(
    @Query() queryDto: GetNotificationsQueryDto,
    @Request() req,
  ): Promise<GetNotificationsResponseDto> {
    return this.notificationsService.findByUser(req.user.id, queryDto);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Unread notifications count',
    description: 'Returns the number of unread notifications for the current user.',
  })
  @ApiOkResponse({ description: 'Unread count returned successfully', type: UnreadCountResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  async unreadCount(@Request() req): Promise<UnreadCountResponseDto> {
    const count = await this.notificationsService.unreadCount(req.user.id);
    return new UnreadCountResponseDto(count);
  }

  @Patch(':id/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID', example: 1 })
  @ApiNoContentResponse({ description: 'Notification marked as read' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  markRead(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    return this.notificationsService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse({ description: 'All notifications marked as read' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  markAllRead(@Request() req): Promise<void> {
    return this.notificationsService.markAllRead(req.user.id);
  }
}
