import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';

import { CommentsService } from './services/comments.service';
import { CommentsController } from './comments.controller';

@Module({
  imports: [ModelModule],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
