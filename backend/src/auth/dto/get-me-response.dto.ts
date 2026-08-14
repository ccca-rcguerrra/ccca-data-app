import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';


export class GetMeResponseDto {
  @ApiProperty({
    description: 'User data',
    type: AuthUserDto,
  })
  data: AuthUserDto;

  constructor(data: AuthUserDto) {
    this.data = data;
  }
}

