import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MultiPolygon } from 'geojson';
import { SemaspaHarvestUnit } from '../../../model/entities/semaspa-harvest-unit.view.entity';

export class HarvestUnitResponseDto {
  @ApiProperty({ description: 'Harvest unit ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Holder name', nullable: true })
  holder: string | null;

  @ApiProperty({ description: 'Property name', nullable: true })
  propertyName: string | null;

  @ApiProperty({ description: 'Process number', nullable: true })
  processNumber: string | null;

  @ApiProperty({ description: 'AUTEF number', nullable: true })
  autefNumber: string | null;

  @ApiProperty({ description: 'AUTEF year', nullable: true })
  autefYear: string | null;

  @ApiProperty({ description: 'AUTEF validity', nullable: true })
  autefValidity: string | null;

  @ApiProperty({ description: 'City', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'Property area (ha, raw text)', nullable: true })
  propertyAreaHa: string | null;

  @ApiProperty({ description: 'Unit area (ha, raw text)', nullable: true })
  unitAreaHa: string | null;

  @ApiProperty({ description: 'Net area (ha, raw text)', nullable: true })
  netAreaHa: string | null;

  @ApiProperty({ description: 'Volume m3 (raw text)', nullable: true })
  volumeM3: string | null;

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

  constructor(entity: SemaspaHarvestUnit, options?: {
    withGeom?: boolean;
    bbox?: [number, number, number, number] | null;
  }) {
    this.id = entity.id;
    this.holder = entity.holder;
    this.propertyName = entity.propertyName;
    this.processNumber = entity.processNumber;
    this.autefNumber = entity.autefNumber;
    this.autefYear = entity.autefYear;
    this.autefValidity = entity.autefValidity;
    this.city = entity.city;
    this.propertyAreaHa = entity.propertyAreaHa;
    this.unitAreaHa = entity.unitAreaHa;
    this.netAreaHa = entity.netAreaHa;
    this.volumeM3 = entity.volumeM3;
    if (options?.withGeom) {
      this.geometry = entity.geometry ?? null;
    }
    if (options?.bbox !== undefined) {
      this.bbox = options.bbox;
    }
  }
}
