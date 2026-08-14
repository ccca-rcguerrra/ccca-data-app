import { ApiProperty } from '@nestjs/swagger';
import type { FeatureCollection } from 'geojson';

export class SentinelImageFeaturesDataDto {
  @ApiProperty({
    description: 'FeatureCollection type',
    example: 'FeatureCollection',
    type: String,
  })
  type: string;

  @ApiProperty({
    description: 'Array of Sentinel-2 image features with geometry and properties',
    type: Array,
  })
  features: any[];

  @ApiProperty({
    description: 'Array of unique dates (YYYY-MM-DD) from all images',
    example: ['2024-01-06', '2024-01-09', '2024-01-16'],
    type: [String],
  })
  dates: string[];
}

export class GetSentinelImageFeaturesResponseDto {
  @ApiProperty({
    description: 'Sentinel-2 images as FeatureCollection with unique dates',
    type: SentinelImageFeaturesDataDto,
  })
  data: SentinelImageFeaturesDataDto;

  constructor(featureCollection: FeatureCollection & { dates: string[] }) {
    this.data = {
      type: featureCollection.type,
      features: featureCollection.features,
      dates: featureCollection.dates,
    };
  }
}

