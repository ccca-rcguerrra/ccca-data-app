import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';
import { SemaspaAutef } from '../../../model/entities/semaspa-autef.view.entity';

export class AutefResponseDto {
  @ApiProperty({ description: 'AUTEF ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'AUTEF title', nullable: true })
  title: string | null;

  @ApiProperty({ description: 'AUTEF number', nullable: true })
  number: string | null;

  @ApiProperty({ description: 'Issue date', nullable: true })
  issuedAt: Date | null;

  @ApiProperty({ description: 'City', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'State (UF)', nullable: true })
  state: string | null;

  @ApiProperty({ description: 'Latitude', nullable: true })
  latitude: string | null;

  @ApiProperty({ description: 'Longitude', nullable: true })
  longitude: string | null;

  @ApiProperty({ description: 'Total area in hectares', nullable: true })
  totalAreaHa: number | null;

  @ApiProperty({ description: 'Process number', nullable: true })
  processNumber: string | null;

  @ApiProperty({ description: 'Issue year', nullable: true })
  issueYear: number | null;

  @ApiProperty({ description: 'Issue month', nullable: true })
  issueMonth: number | null;

  @ApiPropertyOptional({
    description: 'Geometry (MultiPolygon). Present when withGeom=true.',
    nullable: true,
  })
  geometry?: MultiPolygon | null;

  @ApiPropertyOptional({
    description: 'Bounding box [west, south, east, north]. Present when withBbox=true.',
    type: [Number],
    nullable: true,
  })
  bbox?: [number, number, number, number] | null;

  constructor(entity: SemaspaAutef, options?: {
    withGeom?: boolean;
    bbox?: [number, number, number, number] | null;
  }) {
    this.id = entity.id;
    this.title = entity.title;
    this.number = entity.number;
    this.issuedAt = entity.issuedAt;
    this.city = entity.city;
    this.state = entity.state;
    this.latitude = entity.latitude;
    this.longitude = entity.longitude;
    this.totalAreaHa = entity.totalAreaHa;
    this.processNumber = entity.processNumber;
    this.issueYear = entity.issueYear;
    this.issueMonth = entity.issueMonth;
    if (options?.withGeom) {
      this.geometry = entity.geometry ?? null;
    }
    if (options?.bbox !== undefined) {
      this.bbox = options.bbox;
    }
  }
}
