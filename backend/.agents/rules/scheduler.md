# Scheduler Rules

## Pattern: Scheduler → Producer → [Queue] → Processor

Schedulers NEVER do the work themselves. They only enqueue jobs via the Producer.

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DomainProducer } from './domain.producer';

@Injectable()
export class DomainScheduler {
  private readonly logger = new Logger(DomainScheduler.name);

  constructor(
    private readonly producer: DomainProducer,
    private readonly configService: ConfigService,
  ) {}

  private get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleHourly(): Promise<void> {
    if (!this.isProduction) return;          // GUARD: only in production
    this.logger.debug('Enqueuing hourly job...');
    await this.producer.addHourlyJob();       // Delegates to Producer
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async scheduleDaily(): Promise<void> {
    if (!this.isProduction) return;
    this.logger.debug('Enqueuing daily job...');
    await this.producer.addDailyJob({ window: '24h' });
  }
}
```

## Cron Expressions

Use the `CronExpression` enum from `@nestjs/schedule`:

| Expression | Fires |
|------------|-------|
| `EVERY_10_MINUTES` | Every 10 minutes |
| `EVERY_HOUR` | Every hour |
| `EVERY_2_HOURS` | Every 2 hours |
| `EVERY_DAY_AT_1AM` | Daily at 01:00 |
| `EVERY_DAY_AT_4AM` | Daily at 04:00 |

## Scheduler Module Setup

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DomainScheduler } from './domain.scheduler';
import { DomainProducer } from './domain.producer';

@Module({
  imports: [ScheduleModule.forRoot(), BullModule.registerQueue({ name: QUEUES.DOMAIN })],
  providers: [DomainScheduler, DomainProducer],
})
export class DomainModule {}
```

## Rules

- **Schedulers only enqueue** — they call `producer.addXxx()`, never do the work
- **Production guard**: `if (!this.isProduction) return` at top of every `@Cron` method
- **Inject `ConfigService`** to check `NODE_ENV`
- **Inject the Producer** — the scheduler's only dependency besides ConfigService
- **Log with `this.logger.debug()`** — schedulers shouldn't spam production logs
- **ScheduleModule.forRoot()** registered once in the root module that needs it
- **Date-range jobs**: pass calculated date boundaries in the job payload (e.g. `{ since: Date, until: Date }`)
