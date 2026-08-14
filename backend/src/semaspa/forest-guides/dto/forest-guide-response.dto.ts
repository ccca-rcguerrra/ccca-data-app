import { ApiProperty } from '@nestjs/swagger';
import { SemaspaForestGuide } from '../../../model/entities/semaspa-forest-guide.view.entity';

export class ForestGuideResponseDto {
  @ApiProperty({ description: 'Forest guide ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Forest guide number', nullable: true })
  number: string | null;

  @ApiProperty({ description: 'Issue date', nullable: true })
  issuedAt: Date | null;

  @ApiProperty({ description: 'Status', nullable: true })
  status: string | null;

  @ApiProperty({ description: 'Type', nullable: true })
  type: string | null;

  @ApiProperty({ description: 'Permit references', type: [String], nullable: true })
  permitRefs: string[] | null;

  @ApiProperty({ description: 'Vehicle plates', type: [String], nullable: true })
  vehiclePlates: string[] | null;

  constructor(entity: SemaspaForestGuide) {
    this.id = entity.id;
    this.number = entity.number;
    this.issuedAt = entity.issuedAt;
    this.status = entity.status;
    this.type = entity.type;
    this.permitRefs = entity.permitRefs;
    this.vehiclePlates = entity.vehiclePlates;
  }
}
