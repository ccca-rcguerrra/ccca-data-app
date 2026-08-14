import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole as UserRoleEnum } from '../model.enums';
import { User } from './user.entity';

@Entity({
  name: 'user_roles',
  schema: 'public_app',
})
@Unique(['userId', 'role'])
export class UserRole {
  @ApiProperty({ description: 'Unique user role ID', example: 1, type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'User ID', example: 1, type: Number })
  @Column({ name: 'user_id', type: 'int4' })
  userId: number;

  @ApiProperty({ description: 'Role name', example: 'analyst_junior', enum: UserRoleEnum })
  @Column({ type: 'varchar', length: 50 })
  role: UserRoleEnum;

  @ApiProperty({ description: 'ID do usuário que concedeu o papel', example: 1, type: Number, nullable: true })
  @Column({ name: 'granted_by', type: 'int4', nullable: true })
  grantedBy: number | null;

  @ApiProperty({ description: 'Data em que o papel foi concedido', example: '2024-01-01T00:00:00.000Z', type: Date })
  @CreateDateColumn({ name: 'granted_at' })
  grantedAt: Date;

  @ManyToOne(() => User, (user) => user.userRoles, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'granted_by' })
  grantor: User | null;
}
