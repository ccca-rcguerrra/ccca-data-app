# Queue Rules (Bull)

## Architecture

```
Scheduler (@Cron) → Producer.add() → [Redis Queue] → Processor.handle() → Service
                                              │
                                              └── EventEmitter.emit() (optional)
```

## Queue Configuration

### Constants (`queue.constants.ts`)

```typescript
export const QUEUES = {
  DOMAIN: 'domain',
} as const;
```

### Config (`queues.config.ts`)

```typescript
import { BullModule } from '@nestjs/bull';

export const BullRootModule = BullModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    prefix: config.get('WS_BACKEND_REDIS_PREFIX'),
    redis: {
      host: config.get('WS_REDIS_HOST', 'localhost'),
      port: config.get('WS_REDIS_PORT', 6379),
      db: config.get('WS_BACKEND_REDIS_DB', 0),
    },
  }),
  inject: [ConfigService],
});
```

### Module (`queues.module.ts`)

```typescript
@Module({ imports: [BullRootModule] })
export class QueuesModule {}
```

### Domain Registration

In the domain's server module:

```typescript
BullModule.registerQueue({ name: QUEUES.DOMAIN })
```

## Jobs Constants

```typescript
// src/<domain>/constants/<domain>.jobs.ts

export const DOMAIN_JOBS = {
  PROCESS_ITEM: 'domain.process_item',
  CLEANUP: 'domain.cleanup',
} as const;
```

## Producer

```typescript
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { QUEUES } from '../queues/queue.constants';
import { DOMAIN_JOBS } from './constants/domain.jobs';

interface ProcessItemPayload {
  itemId: number;
  options?: Record<string, unknown>;
}

@Injectable()
export class DomainProducer {
  constructor(
    @InjectQueue(QUEUES.DOMAIN)
    private readonly queue: Queue,
  ) {}

  async addProcessItem(payload: ProcessItemPayload): Promise<void> {
    await this.queue.add(
      DOMAIN_JOBS.PROCESS_ITEM,
      payload,
      {
        jobId: `process-item-${payload.itemId}`,   // Deduplication key
        removeOnComplete: true,                     // Auto-clean
      },
    );
  }

  async addCleanup(): Promise<void> {
    await this.queue.add(
      DOMAIN_JOBS.CLEANUP,
      {},
      {
        jobId: 'cleanup-singleton',                 // One-at-a-time
        removeOnComplete: true,
      },
    );
  }
}
```

## Processor

```typescript
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

    // Emit event on completion
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
```

## Producer Method Conventions

- Method name: `addXxx` (add + PascalCase action)
- `jobId`: used for singleton deduplication
- `removeOnComplete: true` — auto-clean after success
- Payload as typed interface

## Processor Method Conventions

- Method name: `handleXxx` (handle + PascalCase action)
- Receives: `job: Job<{ payload }>`
- Extracts: `const { field } = job.data`
- Emits event on completion (if consumers exist)
- Re-throws errors on failure (Bull marks job as failed)

## Recursive Fanout

Processors can enqueue sub-jobs:

```typescript
@Process(DOMAIN_JOBS.PROCESS_BATCH)
async handleBatch(job: Job<{ ids: number[] }>): Promise<void> {
  const { ids } = job.data;
  for (const id of ids) {
    await this.producer.addProcessItem({ itemId: id });
  }
}
```

## Rules

- **Queue names from `QUEUES` constant** — never hardcode strings
- **Job names from `<DOMAIN>_JOBS` constants** — `as const` for type safety
- **Producers only enqueue** — no business logic
- **Processors call services** — processors are thin, services do the work
- **Emit events on completion** — so WebSocket listeners can push to clients
- **`removeOnComplete: true`** — prevent Redis memory bloat
- **`jobId` for dedup** — prevent duplicate jobs from cron/schedulers
