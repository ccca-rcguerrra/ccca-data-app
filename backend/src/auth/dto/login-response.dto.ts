import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';


class LoginDataDto {
  @ApiProperty({
    description: 'JWT token for authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  access_token: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
    type: String,
  })
  token_type: string;

  @ApiProperty({
    description: 'Expiration time in seconds',
    example: 3600,
    default: 3600,
    type: Number,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Authenticated user data',
    type: AuthUserDto,
  })
  user: AuthUserDto;
}

export class AuthLoginResponseDto {
  @ApiProperty({
    description: 'Login response data',
    type: LoginDataDto,
  })
  data: LoginDataDto;

  constructor(data: LoginDataDto) {
    this.data = data;
  }
}
