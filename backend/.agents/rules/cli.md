# CLI Rules (nest-commander)

## Two-Module Pattern

Every domain that needs CLI commands has TWO module files:

| File | Class | Purpose | Imports |
|------|-------|---------|---------|
| `<domain>.module.ts` | `DomainModule` | Server (full) | BullModule, WebSocketModule, Controllers |
| `<domain>.cli-module.ts` | `DomainCliModule` | CLI (lightweight) | ModelModule, Services, NO Bull, NO WS |

## CLI Root Module (`app.clients.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DomainCliModule } from './domain/domain.cli-module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DomainCliModule,
  ],
})
export class CliModule {}
```

Key points:
- `ConfigModule.forRoot({ isGlobal: true })` — always at root
- `EventEmitterModule.forRoot()` — always at root (needed for listeners)
- **NO BullModule** — CLI doesn't process queues
- **NO WebsocketModule** — CLI has no real-time connections

## CLI Entry Point (`cli.ts`)

```typescript
import { CommandFactory } from 'nest-commander';
import { CliModule } from './app.clients';

async function bootstrap() {
  await CommandFactory.run(CliModule, {
    logger: ['error', 'warn', 'log'],
  });
}
bootstrap();
```

## Command Pattern

```typescript
import { Command, CommandRunner, Option } from 'nest-commander';

interface MyCommandOptions {
  force: boolean;
  limit: number;
}

@Command({
  name: 'domain:verb-noun',
  description: 'What this command does.',
})
export class MyCommand extends CommandRunner {
  constructor(private readonly someService: SomeService) {
    super();
  }

  async run(_inputs: string[], options: MyCommandOptions): Promise<void> {
    console.log('Starting...');
    try {
      await this.someService.doWork(options);
      console.log('Done.');
    } catch (err) {
      console.error('Failed:', err.message);
      process.exit(1);
    }
  }

  @Option({
    flags: '-f, --force',
    description: 'Force execution without confirmation',
  })
  parseForce(): boolean {
    return true;
  }

  @Option({
    flags: '-l, --limit <number>',
    description: 'Maximum items to process',
  })
  parseLimit(val: string): number {
    const parsed = Number(val);
    if (!Number.isFinite(parsed) || parsed < 1) {
      throw new Error('--limit must be a positive number');
    }
    return parsed;
  }
}
```

## CLI Module Pattern

```typescript
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
```

## Option Patterns

| Type | Flags | Parser |
|------|-------|--------|
| Boolean | `-f, --force` | `parseForce(): boolean { return true; }` |
| Number | `-l, --limit <number>` | `parseLimit(val: string): number { ... }` |
| String | `-s, --status <status>` | `parseStatus(val: string): string { return val; }` |

## Rules

- **Command naming**: `domain:verb-noun` (e.g. `alerts:fill-metadata`, `sccon:sync-full`)
- **`super()` call required** in constructor
- **`process.exit(1)` on error** — signals failure to the shell
- **`console.log`** for progress, **`console.error`** for errors
- **Validate options** — throw `Error` on invalid input
- **Register commands as providers** in the CLI module
- **Never import Bull/WebSocket in CLI modules**
