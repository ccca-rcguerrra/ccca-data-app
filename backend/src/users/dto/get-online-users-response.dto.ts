import { ApiProperty } from '@nestjs/swagger';

export class OnlineUserDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Full name', example: 'João Silva' })
  name: string;

  @ApiProperty({ description: 'Email', example: 'joao@example.com' })
  email: string;

  @ApiProperty({ description: 'Photo URL', example: 'https://...', nullable: true })
  photo: string | null;
}

export class GetOnlineUsersResponseDto {
  @ApiProperty({ type: [OnlineUserDto] })
  data: OnlineUserDto[];

  @ApiProperty({ description: 'Total online users', example: 3 })
  total: number;

  constructor(data: OnlineUserDto[]) {
    this.data = data;
    this.total = data.length;
  }
}
