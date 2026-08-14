import { ApiProperty } from '@nestjs/swagger';

export class GeeStatusDataDto {
  @ApiProperty({
    description: 'Indicates if GEE was initialized',
    example: true,
    type: Boolean,
  })
  initialized: boolean;

  @ApiProperty({
    description: 'Indicates if GEE authentication was performed',
    example: true,
    type: Boolean,
  })
  authenticated: boolean;

  @ApiProperty({
    description: 'Indicates if GEE is ready for use (initialized && authenticated)',
    example: true,
    type: Boolean,
  })
  ready: boolean;
}

export class GetGeeStatusResponseDto {
  @ApiProperty({
    description: 'GEE initialization status data',
    type: GeeStatusDataDto,
  })
  data: GeeStatusDataDto;

  constructor(initialized: boolean, authenticated: boolean, ready: boolean) {
    this.data = {
      initialized,
      authenticated,
      ready,
    };
  }
}

