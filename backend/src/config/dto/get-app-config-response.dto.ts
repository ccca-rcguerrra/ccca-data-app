import { ApiProperty } from '@nestjs/swagger';
import { AppConfigDto } from './app-config.dto';

export class GetAppConfigResponseDto {
  @ApiProperty({
    description: 'Resolved system configuration for this initiative',
    type: AppConfigDto,
  })
  data: AppConfigDto;

  constructor(data: AppConfigDto) {
    this.data = data;
  }
}
