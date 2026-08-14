import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Comment } from '../../model/entities/comment.entity';
import { UserRole as UserRoleEnum } from '../../model/model.enums';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { GetCommentsQueryDto } from '../dto/get-comments-query.dto';
import { GetCommentsResponseDto } from '../dto/get-comments-response.dto';
import { CommentResponseDto } from '../dto/comment-response.dto';
import {
  COMMENT_EVENTS,
  CommentCreatedEvent,
  CommentDeletedEvent,
  CommentMentionedEvent,
} from '../../websocket/events/comment.events';

/** Minimal shape of the authenticated user injected by the JWT guard. */
interface AuthUser {
  id: number;
  name?: string;
  userRoles?: { role: UserRoleEnum }[];
}

function parseResourceIdFromChannel(channel: string): number | undefined {
  const match = /^(\w+):(\d+)$/.exec(channel);
  return match ? Number(match[2]) : undefined;
}

/** Builds a short plain-text preview from comment content (strips @[Name](id) tokens). */
function buildPreview(content: string, max = 140): string {
  const plain = content.replace(/@\[([^\]]+)\]\(\d+\)/g, '@$1').trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAll(queryDto: GetCommentsQueryDto): Promise<GetCommentsResponseDto> {
    const { channel, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .where('comment.channel = :channel', { channel })
      .orderBy('comment.createdAt', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = comments.map((comment) => new CommentResponseDto(comment));
    return new GetCommentsResponseDto(data, page, limit, total);
  }

  async create(dto: CreateCommentDto, author: AuthUser): Promise<CommentResponseDto> {
    const userId = author.id;
    const mentionedUserIds = Array.from(new Set(dto.mentionedUserIds ?? []));

    const created = await this.commentRepository.save(
      this.commentRepository.create({
        channel: dto.channel,
        content: dto.content,
        mentionedUserIds: mentionedUserIds.length ? mentionedUserIds : null,
        userId,
      }),
    );

    const comment = await this.commentRepository.findOne({
      where: { id: created.id },
      relations: { user: true },
    });

    this.eventEmitter.emit(COMMENT_EVENTS.CREATED, {
      channel: created.channel,
      commentId: created.id,
      userId,
    } as CommentCreatedEvent);

    const recipients = mentionedUserIds.filter((id) => id !== userId);
    if (recipients.length > 0) {
      this.eventEmitter.emit(COMMENT_EVENTS.MENTIONED, {
        channel: created.channel,
        commentId: created.id,
        resourceId: parseResourceIdFromChannel(created.channel),
        actorId: userId,
        actorName: comment?.user?.name ?? author.name ?? 'Alguém',
        mentionedUserIds: recipients,
        preview: buildPreview(created.content),
      } as CommentMentionedEvent);
    }

    return new CommentResponseDto(comment ?? created);
  }

  async remove(id: number, user: AuthUser): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Comment ${id} not found`);
    }

    const isAuthor = comment.userId === user.id;
    const isAdmin = (user.userRoles ?? []).some((ur) => ur.role === UserRoleEnum.ADMIN);
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.softDelete(id);

    this.eventEmitter.emit(COMMENT_EVENTS.DELETED, {
      channel: comment.channel,
      commentId: id,
      userId: user.id,
    } as CommentDeletedEvent);
  }
}
