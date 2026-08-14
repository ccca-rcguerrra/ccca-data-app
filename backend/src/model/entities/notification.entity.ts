import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { NotificationType } from '../model.enums';

/** Arbitrary, type-specific payload carried by a notification. */
export interface NotificationData {
  channel?: string;
  commentId?: number;
  resourceId?: number;
  actorId?: number;
  actorName?: string;
  [key: string]: unknown;
}

@Entity({ name: 'notifications', schema: 'public_app' })
export class Notification {
  @ApiProperty({ description: 'Unique notification ID', example: 1, type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Recipient user ID', example: 1, type: Number })
  @Column({ name: 'user_id', type: 'int4' })
  @Index()
  userId: number;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @Column({ type: 'varchar', length: 50 })
  @Index()
  type: NotificationType;

  @ApiProperty({ description: 'Short title', example: 'Você foi mencionado', type: String })
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @ApiProperty({ description: 'Body text', example: 'Maria mencionou você em um comentário.', type: String })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({
    description: 'Type-specific payload (channel, commentId, alertId, actorId, …)',
    type: Object,
  })
  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  data: NotificationData;

  @ApiProperty({
    description: 'Read timestamp (null when unread)',
    type: Date,
    nullable: true,
  })
  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  @Index()
  readAt: Date | null;

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
