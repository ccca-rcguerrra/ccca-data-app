import { ApiProperty } from '@nestjs/swagger';
import { Comment } from '../../model/entities/comment.entity';

export class CommentAuthorDto {
  @ApiProperty({ description: 'Author user ID', example: 1, type: Number })
  id: number;

  @ApiProperty({ description: 'Author name', example: 'Maria Silva', type: String })
  name: string;

  @ApiProperty({ description: 'Author email', example: 'maria@example.com', type: String })
  email: string;

  @ApiProperty({
    description: 'Author photo URL',
    example: 'https://example.com/photo.jpg',
    type: String,
    nullable: true,
  })
  photo: string | null;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID', example: 1, type: Number })
  id: number;

  @ApiProperty({ description: 'Channel', example: 'alert:123', type: String })
  channel: string;

  @ApiProperty({ description: 'Comment content', example: 'Geometria revisada.', type: String })
  content: string;

  @ApiProperty({
    description: 'IDs of users mentioned in the comment',
    example: [2, 5],
    type: [Number],
  })
  mentionedUserIds: number[];

  @ApiProperty({ description: 'Author info', type: CommentAuthorDto })
  author: CommentAuthorDto;

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', type: Date })
  updatedAt: Date;

  constructor(comment: Comment) {
    this.id = comment.id;
    this.channel = comment.channel;
    this.content = comment.content;
    this.mentionedUserIds = comment.mentionedUserIds ?? [];
    this.createdAt = comment.createdAt;
    this.updatedAt = comment.updatedAt;
    this.author = {
      id: comment.userId,
      name: comment.user?.name ?? '',
      email: comment.user?.email ?? '',
      photo: comment.user?.photo ?? null,
    };
  }
}
