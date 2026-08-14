import { IsNotEmpty, IsString, IsDateString, IsOptional, IsObject, IsNumber, Min, Max, IsArray, ArrayMinSize, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { Geometry } from 'geojson';

type SpectralIndex = 'NDVI' | 'NBR' | 'NDMI';
type TemporalResolution = 'day' | 'week' | 'month';

export class GetSentinelIndexesTimeSeriesQueryDto {
  @ApiProperty({
    description: 'Start date for image filtering (ISO 8601 format)',
    example: '2022-02-10',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for image filtering (ISO 8601 format)',
    example: '2024-04-09',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Geometry for spatial filtering (GeoJSON Geometry). Required for index calculation.',
    example: {
      type: 'Polygon',
      coordinates: [
        [
          [-71.02623351840998, -8.065815601818626],
          [-71.00628748159004, -8.065815601818626],
          [-71.00628748159004, -8.046066398181381],
          [-71.02623351840998, -8.046066398181381],
          [-71.02623351840998, -8.065815601818626]
        ]
      ]
    },
    type: Object,
    required: true,
  })
  @IsNotEmpty()
  @IsObject()
  geometry: Geometry;

  @ApiProperty({
    description: 'Maximum cloud cover percentage (0-100). Filters images with cloud cover less than or equal to this value.',
    example: 90,
    type: Number,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  cloudCoverPercentage?: number;

  @ApiProperty({
    description: 'Scale in meters for index calculation (default: 10)',
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
    description: 'List of spectral indexes to calculate. Available: NDVI, NBR, NDMI',
    example: ['NDVI'],
    type: [String],
    enum: ['NDVI', 'NBR', 'NDMI'],
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(['NDVI', 'NBR', 'NDMI'], { each: true })
  indexes: SpectralIndex[];

  @ApiProperty({
    description: 'Temporal aggregation step (one data point per period). Default: day',
    example: 'day',
    enum: ['day', 'week', 'month'],
    required: false,
  })
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  temporalResolution?: TemporalResolution;
}

