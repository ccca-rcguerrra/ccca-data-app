import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';

import { TerritoriesService } from './services/territories.service';
import { TerritoriesController } from './territories.controller';

@Module({
  imports: [ModelModule],
  controllers: [TerritoriesController],
  providers: [TerritoriesService],
  exports: [TerritoriesService],
})
export class TerritoriesModule { }

