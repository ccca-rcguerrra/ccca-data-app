import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsArray, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '../../model/model.enums';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Unique user ID',
    example: 1,
    type: Number,
  })
  @IsNotEmpty()
  @IsInt()
  id: number;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'João Silva',
    type: String,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @ApiProperty({
    description: 'User email',
    example: 'joao.silva@example.com',
    type: String,
    maxLength: 200,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiProperty({
    description: 'User password',
    example: '$%TnY8z*8x',
    type: String,
    maxLength: 100,
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password?: string;

  @ApiProperty({
    description: 'User photo URL',
    example: 'https://example.com/photo.jpg',
    type: String,
    maxLength: 500,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  photo?: string;

  @ApiProperty({
    description: 'Google ID for OAuth authentication',
    example: '123456789',
    type: String,
    maxLength: 50,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  googleId?: string;

  @ApiProperty({
    description: 'User account status',
    example: 1,
    type: Number,
    required: false,
  })
  @IsOptional()
  status?: number;

  @ApiProperty({
    description: 'User institution',
    example: 'University of Example',
    type: String,
    maxLength: 500,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  institution?: string;

  @ApiProperty({
    description: 'Team IDs to assign to the user (replaces current teams)',
    example: [1, 2],
    type: [Number],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  teamIds?: number[];

  @ApiProperty({
    description: 'Papéis do usuário no sistema (substitui os papéis atuais)',
    example: ['analyst_senior', 'analyst_support'],
    enum: UserRole,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
