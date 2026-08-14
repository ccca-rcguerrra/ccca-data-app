import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
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
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './services/comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { GetCommentsResponseDto } from './dto/get-comments-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@ApiTags('comments')
@Controller('api/comments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  @ApiOperation({
    summary: 'List comments by channel',
    description: 'Returns a paginated list of comments for a given channel (e.g. "alert:123").',
  })
  @ApiOkResponse({ description: 'Comments list returned successfully', type: GetCommentsResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  findAll(@Query() queryDto: GetCommentsQueryDto): Promise<GetCommentsResponseDto> {
    return this.commentsService.findAll(queryDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a comment',
    description: 'Creates a comment authored by the current user on the given channel.',
  })
  @ApiCreatedResponse({ description: 'Comment created successfully', type: CommentResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  create(@Body() dto: CreateCommentDto, @Request() req): Promise<CommentResponseDto> {
    return this.commentsService.create(dto, req.user);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a comment',
    description: 'Soft-deletes a comment. Allowed only to the author or an admin.',
  })
  @ApiParam({ name: 'id', description: 'ID of the comment to delete', example: 1 })
  @ApiNoContentResponse({ description: 'Comment deleted successfully' })
  @ApiForbiddenResponse({ description: 'Not the author nor an admin' })
  @ApiNotFoundResponse({ description: 'Comment not found' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired JWT token' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    return this.commentsService.remove(id, req.user);
  }
}
