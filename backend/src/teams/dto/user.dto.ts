import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
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
}





