import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { QUEUES } from '../queues/queue.constants';
import { DOMAIN_JOBS } from './constants/domain.jobs';
import { DOMAIN_EVENTS, DomainProcessedEvent } from './events/domain.events';
import { DomainService } from './services/domain.service';

@Processor(QUEUES.DOMAIN)
export class DomainProcessor {
  constructor(
    private readonly domainService: DomainService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process(DOMAIN_JOBS.PROCESS_ITEM)
  async handleProcessItem(job: Job<{ itemId: number }>): Promise<void> {
    const { itemId } = job.data;
    const result = await this.domainService.process(itemId);

    const event = new DomainProcessedEvent();
    event.itemId = itemId;
    event.result = result;
    this.eventEmitter.emit(DOMAIN_EVENTS.PROCESSED, event);
  }

  @Process(DOMAIN_JOBS.CLEANUP)
  async handleCleanup(job: Job): Promise<void> {
    await this.domainService.cleanup();
  }
}
