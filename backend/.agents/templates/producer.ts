import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUES } from '../queues/queue.constants';
import { DOMAIN_JOBS } from './constants/domain.jobs';

interface ProcessItemPayload {
  itemId: number;
}

@Injectable()
export class DomainProducer {
  constructor(
    @InjectQueue(QUEUES.DOMAIN)
    private readonly queue: Queue,
  ) {}

  async addProcessItem(payload: ProcessItemPayload): Promise<void> {
    await this.queue.add(DOMAIN_JOBS.PROCESS_ITEM, payload, {
      jobId: `process-item-${payload.itemId}`,
      removeOnComplete: true,
    });
  }

  async addCleanup(): Promise<void> {
    await this.queue.add(DOMAIN_JOBS.CLEANUP, {}, {
      jobId: 'cleanup-singleton',
      removeOnComplete: true,
    });
  }
}
