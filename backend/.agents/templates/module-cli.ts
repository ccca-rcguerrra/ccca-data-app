import { Module } from '@nestjs/common';
import { ModelModule } from '../model/model.module';
import { DomainService } from './services/domain.service';
import { MyCommand } from './commands/my.command';

@Module({
  imports: [ModelModule],
  providers: [DomainService, MyCommand],
  exports: [DomainService],
})
export class DomainCliModule {}
