import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UsersTeam } from './users-team.entity';
import { UserRole } from './user-role.entity';

@Entity({
  name: 'users',
  schema: 'public_app',
})
export class User {
  @ApiProperty({
    description: 'Unique user ID',
    example: 1,
    type: Number,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Rafael Guerra',
    type: String,
    maxLength: 500,
  })
  @Column({
    length: 500,
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'rcguerra82@gmail.com',
    type: String,
    maxLength: 200,
  })
  @Column({
    length: 200,
  })
  email: string;

  @ApiProperty({
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @Column({
    length: 500,
    nullable: true,
  })
  photo: string;

  @ApiProperty({
    description: 'Google ID for OAuth authentication',
    example: '123456789',
    type: String,
    maxLength: 50,
    nullable: true,
  })
  @Column({
    name: 'googleid',
    length: 50,
    nullable: true,
  })
  googleId: string;

  @ApiProperty({
    description: 'User encrypted password',
    example: '$2b$10$...',
    type: String,
    maxLength: 100,
  })
  @Column({
    length: 100,
  })
  password: string;

  @ApiProperty({
    description: 'User account status',
    example: 1,
    type: Number,
    default: 1,
  })
  @Column({
    type: 'numeric',
    precision: 2,
    default: 1,
  })
  status: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date of last account update',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'User institution',
    example: 'University of Example',
    type: String,
    maxLength: 500,
    nullable: true,
  })
  @Column({
    length: 500,
    nullable: true,
  })
  institution: string;

  @OneToMany(() => UsersTeam, (userTeam) => userTeam.user)
  teams: UsersTeam[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
}
