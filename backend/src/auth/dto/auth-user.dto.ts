import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../model/model.enums';
import { Permission } from '../auth.permissions';

export class AuthUserDto {
  @ApiProperty({
    description: 'Unique user ID',
    example: 1,
    type: Number,
  })
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'João Silva',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'User email',
    example: 'joao.silva@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
    type: String,
    nullable: true,
    required: false,
  })
  photo: string | null;

  @ApiProperty({
    description: 'User institution',
    example: 'University of Example',
    type: String,
    nullable: true,
    required: false,
  })
  institution: string | null;

  @ApiProperty({
    description: 'User account status',
    example: 1,
    type: Number,
  })
  status: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date of last account update',
    example: '2024-01-01T00:00:00.000Z',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Papéis do usuário no sistema',
    example: ['analyst_junior', 'analyst_support'],
    enum: UserRole,
    isArray: true,
  })
  roles: UserRole[];

  @ApiProperty({
    description: 'IDs dos times aos quais o usuário pertence',
    example: [1, 2],
    type: Number,
    isArray: true,
  })
  teamIds: number[];

  @ApiProperty({
    description: 'Permissões computadas a partir dos papéis do usuário',
    example: ['activations.create', 'refinements.approve'],
    enum: Permission,
    isArray: true,
  })
  permissions: Permission[];
}
