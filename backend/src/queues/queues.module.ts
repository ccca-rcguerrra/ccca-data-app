import { Module } from '@nestjs/common';
import { BullRootModule } from './queues.config';

@Module({
  imports: [BullRootModule],
})
export class QueuesModule {}
