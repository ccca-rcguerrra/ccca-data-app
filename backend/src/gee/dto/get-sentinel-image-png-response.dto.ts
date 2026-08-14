import { ApiProperty } from '@nestjs/swagger';

export class SentinelImagePngDataDto {
  @ApiProperty({
    description: 'URL of the PNG image; omitted when no images match the filters',
    example: 'https://earthengine.googleapis.com/v1/projects/earthengine-legacy/thumbnails/...',
    type: String,
    required: false,
  })
  url?: string;
}

export class GetSentinelImagePngResponseDto {
  @ApiProperty({
    description: 'Sentinel-2 PNG image data',
    type: SentinelImagePngDataDto,
  })
  data: SentinelImagePngDataDto;

  constructor(url?: string) {
    this.data = {
      ...(url !== undefined && url !== null ? { url } : {}),
    };
  }
}

