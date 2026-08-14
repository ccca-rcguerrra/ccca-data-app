# Backend — Agent Guide

@.agents/context/quickstart.md
@.agents/context/map.md
@.agents/context/stack.md
@.agents/context/conventions.md

## Domain Rules

@.agents/rules/modules.md
@.agents/rules/entities.md
@.agents/rules/auth.md
@.agents/rules/api-design.md
@.agents/rules/websocket.md
@.agents/rules/cli.md
@.agents/rules/scheduler.md
@.agents/rules/queues.md
@.agents/rules/events.md

## Templates

Copy full working code from `.agents/templates/` when creating new files:

### Core NestJS
- `module.ts` — Server module (imports, controllers, providers, exports)
- `module-cli.ts` — CLI module (lightweight, no Bull/WS)
- `controller.ts` — Controller with Swagger, guards, CRUD
- `service.ts` — Service with InjectRepository + EventEmitter2
- `entity.ts` — TypeORM entity with decorators
- `dto-create.ts` — Create DTO with class-validator
- `dto-response.ts` — Response DTO with ApiProperty + pagination wrapper
- `dto-query.ts` — Query DTO with pagination + filters
- `migration.ts` — Migration using QueryRunner API

### Advanced Patterns
- `gateway.ts` — WebSocket gateway with JWT auth
- `cli-command.ts` — nest-commander command with @Option
- `scheduler.ts` — @Cron scheduler (delegates to producer)
- `producer.ts` — Bull producer (InjectQueue, addXxx)
- `processor.ts` — Bull processor (@Process, emits events)
- `event.ts` — EventEmitter2 events (constants + classes)
- `listener.ts` — @OnEvent listener (fire-and-forget)
