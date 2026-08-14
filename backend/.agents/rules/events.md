# Events Rules (EventEmitter2)

## Architecture

```
Domain Service / Processor
        │
        ▼  eventEmitter.emit(EVENT_CONSTANT, eventInstance)
        │
        ├──► Domain Listener (@OnEvent)
        │      └── Side effects, cross-domain sync
        │
        └──► WS Bridge Listener (@OnEvent)
               └── WebsocketService.emitToUser/Room()
```

## Event Definition

```typescript
// src/<domain>/events/<domain>.events.ts

export const DOMAIN_EVENTS = {
  CREATED: 'domain.created',
  UPDATED: 'domain.updated',
  DELETED: 'domain.deleted',
} as const;

export class DomainCreatedEvent {
  id: number;
  userId: number;
  name: string;
}

export class DomainUpdatedEvent {
  id: number;
  changes: Record<string, unknown>;
}
```

### Naming Convention

Event names follow `domain.action.verb`:
- `domain.created`
- `domain.updated`
- `comment.created`
- `comment.mentioned`
- `activation.export.completed`
- `sccon.alert_status.received`

Event classes have NO constructor, NO decorators — plain public fields.

## Emitting Events

```typescript
// In a service or processor:
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DomainService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async create(dto: CreateDto): Promise<Domain> {
    const entity = await this.repository.save(dto);
    const event = new DomainCreatedEvent();
    event.id = entity.id;
    event.userId = dto.userId;
    event.name = entity.name;
    this.eventEmitter.emit(DOMAIN_EVENTS.CREATED, event);
    return entity;
  }
}
```

## Listener (Domain Side-Effect)

```typescript
// src/<domain>/listeners/<event>-<action>.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS, DomainCreatedEvent } from '../events/domain.events';
import { OtherDomainService } from '../../other-domain/services/other-domain.service';

@Injectable()
export class DomainCreatedListener {
  private readonly logger = new Logger(DomainCreatedListener.name);

  constructor(private readonly otherService: OtherDomainService) {}

  @OnEvent(DOMAIN_EVENTS.CREATED)
  async onDomainCreated(event: DomainCreatedEvent): Promise<void> {
    try {
      await this.otherService.syncFromDomain(event.id);
    } catch (err) {
      this.logger.error(`Failed to sync domain ${event.id}`, err);
      // DO NOT re-throw — fire-and-forget pattern
    }
  }
}
```

## Listener (WebSocket Bridge)

```typescript
// src/websocket/listeners/<domain>.listener.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS, DomainCreatedEvent } from '../../domain/events/domain.events';
import { WebsocketService } from '../websocket.service';

@Injectable()
export class DomainWsListener {
  constructor(private readonly wsService: WebsocketService) {}

  @OnEvent(DOMAIN_EVENTS.CREATED)
  onDomainCreated(event: DomainCreatedEvent) {
    this.wsService.emitToUser(event.userId, 'domain:created', { id: event.id, name: event.name });
  }
}
```

## EventEmitter2 Configuration

```typescript
// In app.module.ts
EventEmitterModule.forRoot({
  wildcard: true,   // Allows listening with wildcard patterns
})
```

## Rules

- **Event constants use `as const`** — type-safe, no magic strings
- **Event classes are plain** — no constructor, no decorators, no methods
- **Listeners use `@OnEvent(CONSTANT)`** — the string constant, not the class
- **Fire-and-forget**: log errors, never re-throw in listeners
- **Two listener categories**:
  - Domain listeners → cross-domain side effects (sync, metadata updates)
  - WS bridge listeners → push updates to connected clients
- **Register listeners as providers** in their module
- **Listeners are NOT controllers** — they don't handle HTTP requests
- **Wildcards**: `EventEmitterModule.forRoot({ wildcard: true })` enables `@OnEvent('domain.*')`
