import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from './user.entity';

export interface IndicatorSavedFilterValues {
  city?: string;
  state?: string;
  issuedFrom?: string;
  issuedTo?: string;
  speciesProductId?: string;
  scientificName?: string;
  commonName?: string;
  movedRatioMin?: number;
  movedRatioMax?: number;
  excessVolumeMin?: number;
}

@Entity({ name: 'indicator_saved_filters', schema: 'public_app' })
export class IndicatorSavedFilter {
  @ApiProperty({ description: 'Saved filter ID', example: 1, type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Owner user ID', example: 1, type: Number })
  @Column({ name: 'user_id', type: 'int4' })
  @Index()
  userId: number;

  @ApiProperty({ description: 'Preset name', example: 'Santarem over-extraction' })
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @ApiPropertyOptional({
    description: 'Catalog indicator id; null means the any (volume) view',
    example: 'autef_over_extracted',
    nullable: true,
  })
  @Column({ name: 'indicator_id', type: 'varchar', length: 80, nullable: true })
  indicatorId: string | null;

  @ApiProperty({ description: 'Persisted Center filters', type: Object })
  @Column({ type: 'jsonb', default: () => `'{}'::jsonb` })
  filters: IndicatorSavedFilterValues;

  @ApiProperty({ description: 'Creation timestamp', type: Date })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', type: Date })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
