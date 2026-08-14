import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { DomainController } from './domain.controller';
import { DomainService } from './services/domain.service';

@Module({
  imports: [ModelModule],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService],
})
export class DomainModule {}
