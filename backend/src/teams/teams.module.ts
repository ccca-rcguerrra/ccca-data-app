import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';

import { TeamsService } from './services/teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [ModelModule],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule { }





