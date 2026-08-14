import { ApiProperty } from '@nestjs/swagger';

export class SentinelImageMapLayerDataDto {
  @ApiProperty({
    description: 'Map ID from Google Earth Engine',
    example: '1234567890',
    type: String,
    required: false,
  })
  mapid?: string;

  @ApiProperty({
    description: 'Authentication token for map layer',
    example: 'abc123def456',
    type: String,
    required: false,
  })
  token?: string;

  @ApiProperty({
    description: 'URL format for map tiles',
    example: 'https://earthengine.googleapis.com/map/{mapid}/{z}/{x}/{y}?token={token}',
    type: String,
    required: false,
  })
  urlFormat?: string;
}

export class GetSentinelImageMapLayerResponseDto {
  @ApiProperty({
    description: 'Sentinel-2 map layer data',
    type: SentinelImageMapLayerDataDto,
  })
  data: SentinelImageMapLayerDataDto;

  constructor(mapid?: string, token?: string, urlFormat?: string) {
    this.data = {
      ...(mapid !== undefined ? { mapid } : {}),
      ...(token !== undefined ? { token } : {}),
      ...(urlFormat !== undefined ? { urlFormat } : {}),
    };
  }
}

