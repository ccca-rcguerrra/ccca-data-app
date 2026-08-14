import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity({ name: 'comments', schema: 'public_app' })
export class Comment {
  @ApiProperty({ description: 'Unique comment ID', example: 1, type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Channel the comment belongs to (e.g. "alert:123")',
    example: 'alert:123',
    type: String,
  })
  @Column({ type: 'varchar', length: 120 })
  @Index()
  channel: string;

  @ApiProperty({ description: 'Author user ID', example: 1, type: Number })
  @Column({ name: 'user_id', type: 'int4' })
  @Index()
  userId: number;

  @ApiProperty({ description: 'Comment content', example: 'Geometria revisada.', type: String })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({
    description: 'IDs of users mentioned in the comment',
    example: [2, 5],
    type: [Number],
    nullable: true,
  })
  @Column({ name: 'mentioned_user_ids', type: 'int4', array: true, nullable: true })
  mentionedUserIds: number[] | null;

  @ApiProperty({ description: 'Date when the comment was created', type: Date })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Date when the comment was last updated', type: Date })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Soft-delete timestamp (null when active)',
    type: Date,
    nullable: true,
  })
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
