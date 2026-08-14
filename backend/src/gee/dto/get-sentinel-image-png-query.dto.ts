import { IsNotEmpty, IsString, IsDateString, IsOptional, IsObject, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import type { Geometry } from 'geojson';
import { SentinelVisualization } from '../types/sentinel-visualization.enum';

export class GetSentinelImagePngQueryDto {
  @ApiProperty({
    description: 'Start date for image filtering (ISO 8601 format)',
    example: '2024-01-01',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for image filtering (ISO 8601 format)',
    example: '2024-01-31',
    type: String,
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'Geometry for spatial filtering (GeoJSON Geometry)',
    example: {
      coordinates: [
        [
          [
            -58.10451253918234,
            -13.457198444450697
          ],
          [
            -58.10451253918234,
            -13.918707087641948
          ],
          [
            -57.509680976734856,
            -13.918707087641948
          ],
          [
            -57.509680976734856,
            -13.457198444450697
          ],
          [
            -58.10451253918234,
            -13.457198444450697
          ]
        ]
      ],
      type: 'Polygon'
    },
    type: Object,
    required: false,
  })
  @IsOptional()
  @IsObject()
  geometry?: Geometry;

  @ApiProperty({
    description: 'Maximum cloud cover percentage (0-100). Filters images with cloud cover less than this value.',
    example: 50,
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
    description: 'Size of the PNG image in pixels (square image: width = height = size)',
    example: 200,
    type: Number,
    minimum: 1,
    maximum: 4096,
    required: true,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4096)
  size: number;

  @ApiProperty({
    description: 'Visualization mode for the mosaic. Defaults to NATURAL_COLOR when omitted.',
    enum: SentinelVisualization,
    example: SentinelVisualization.NaturalColor,
    required: false,
  })
  @IsOptional()
  @IsEnum(SentinelVisualization)
  visualization?: SentinelVisualization;

  @ApiProperty({
    description: 'Apply Cloud Score+ cloud masking and compute a cloud-free median composite. Default: false (raw mosaic with clouds visible).',
    type: Boolean,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  cloudMask?: boolean;
}

