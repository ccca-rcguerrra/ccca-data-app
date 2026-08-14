import { ApiProperty } from '@nestjs/swagger';

export class IndexesTimeSeriesPointDto {
  @ApiProperty({
    description: 'Date of the image (ISO 8601 format)',
    example: '2024-01-15',
    type: String,
  })
  date: string;

  @ApiProperty({
    description: 'Mean values for the requested spectral indexes on this date (same order as indexes parameter). Null values indicate missing or invalid data for that index.',
    example: [0.65, 0.32, 0.45],
    type: [Number],
    nullable: true,
  })
  values: (number | null)[];

  @ApiProperty({
    description: 'Number of images available on this date (after filters and masking)',
    example: 2,
    type: Number,
  })
  count: number;
}

export class SentinelIndexesTimeSeriesDataDto {
  @ApiProperty({
    description: 'Array of time series points with date and mean values for requested spectral indexes',
    type: [IndexesTimeSeriesPointDto],
  })
  timeSeries: IndexesTimeSeriesPointDto[];

  @ApiProperty({
    description: 'Number of points in the time series',
    example: 12,
    type: Number,
  })
  count: number; 
}

export class GetSentinelIndexesTimeSeriesResponseDto {
  @ApiProperty({
    description: 'Spectral indexes time series data',
    type: SentinelIndexesTimeSeriesDataDto,
  })
  data: SentinelIndexesTimeSeriesDataDto;

  constructor(timeSeries: Array<{ date: string; values: (number | null)[]; count: number }>) {
    this.data = {
      timeSeries: timeSeries.map((point) => ({
        date: point.date,
        values: point.values,
        count: point.count,
      })),
      count: timeSeries.length,
    };
  }
}

