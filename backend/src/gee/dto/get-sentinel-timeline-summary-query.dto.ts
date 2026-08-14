import { IsNotEmpty, IsString, IsDateString, IsOptional, IsObject, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { Geometry } from 'geojson';

type TemporalResolution = 'day' | 'week' | 'month';

export class GetSentinelTimelineSummaryQueryDto {
  @ApiProperty({
    description: 'Start date for image filtering (ISO 8601 format)',
    example: '2022-01-01',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for image filtering (ISO 8601 format)',
    example: '2024-12-31',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description:
      'Geometry for spatial filtering (GeoJSON Geometry). Required. Prefer the tight alert polygon (not a large buffer) so the NDVI signal reflects the alert area.',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-71.02623351840998, -8.065815601818626],
          [-71.00628748159004, -8.065815601818626],
          [-71.00628748159004, -8.046066398181381],
          [-71.02623351840998, -8.046066398181381],
          [-71.02623351840998, -8.065815601818626],
        ],
      ],
    },
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  geometry: Geometry;

  @ApiProperty({
    description: 'Scale in meters for NDVI reduction (default: 10)',
    example: 10,
    type: Number,
    minimum: 10,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(1000)
  scale?: number;

  @ApiProperty({
    description: 'Temporal aggregation step (one data point per period). Default: month',
    example: 'month',
    enum: ['day', 'week', 'month'],
    required: false,
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  temporalResolution?: TemporalResolution;
}
