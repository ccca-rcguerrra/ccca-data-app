import { ApiProperty } from '@nestjs/swagger';

export class TimelineSummaryPointDto {
  @ApiProperty({
    description: 'Period start date (ISO 8601 format)',
    example: '2024-01-01',
    type: String,
  })
  date: string;

  @ApiProperty({
    description: 'Mean NDVI over the AOI for this period. Null when there is no valid (cloud-free) data.',
    example: 0.72,
    type: Number,
    nullable: true,
  })
  ndvi: number | null;

  @ApiProperty({
    description:
      'Mean scene cloud cover (CLOUDY_PIXEL_PERCENTAGE, 0-100) across the images in this period — the same property the cloud-cover filter uses. Null when there is no image.',
    example: 23.5,
    type: Number,
    nullable: true,
  })
  cloud: number | null;

  @ApiProperty({
    description: 'Number of images available in this period (intersecting the AOI)',
    example: 4,
    type: Number,
  })
  count: number;
}

export class SentinelTimelineSummaryDataDto {
  @ApiProperty({
    description: 'Array of per-period summary points (NDVI, mean cloud cover, image count)',
    type: [TimelineSummaryPointDto],
  })
  summary: TimelineSummaryPointDto[];

  @ApiProperty({
    description: 'Number of points in the summary',
    example: 12,
    type: Number,
  })
  count: number;
}

export class GetSentinelTimelineSummaryResponseDto {
  @ApiProperty({
    description: 'Sentinel-2 timeline summary data',
    type: SentinelTimelineSummaryDataDto,
  })
  data: SentinelTimelineSummaryDataDto;

  constructor(
    summary: Array<{ date: string; ndvi: number | null; cloud: number | null; count: number }> = [],
  ) {
    this.data = {
      summary: summary.map((point) => ({
        date: point.date,
        ndvi: point.ndvi,
        cloud: point.cloud,
        count: point.count,
      })),
      count: summary.length,
    };
  }
}
