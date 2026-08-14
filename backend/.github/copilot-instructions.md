# Workspace Backend — Copilot Instructions

NestJS 11 + TypeORM + PostgreSQL + Redis + Bull + Socket.io + Passport JWT + Swagger.

## Project knowledge

All patterns, conventions, and templates are documented in `.agents/`. Load the following before writing code:

1. `.agents/context/conventions.md` — Universal DO/DON'T, naming, imports
2. `.agents/context/map.md` — Directory structure (where to put files)
3. `.agents/context/stack.md` — Exact versions of all dependencies
4. `.agents/rules/modules.md` — NestJS module pattern
5. `.agents/rules/entities.md` — TypeORM entity + migration pattern
6. `.agents/rules/auth.md` — JWT, guards, decorators, roles
7. `.agents/rules/api-design.md` — DTOs, validation, Swagger, pagination
8. `.agents/rules/websocket.md` — Socket.io gateway + events
9. `.agents/rules/cli.md` — nest-commander CLI commands
10. `.agents/rules/scheduler.md` — Cron jobs (scheduler → producer)
11. `.agents/rules/queues.md` — Bull producer + processor
12. `.agents/rules/events.md` — EventEmitter2 events + listeners

Full copy-paste code templates at `.agents/templates/`.

## Key constraints

- ALL tables in `public` schema
- Migrations use QueryRunner API (never raw SQL, except PostGIS geometry)
- No FK constraints on `user_roles` table (`createForeignKeyConstraints: false`)
- CLI modules never import BullModule or WebsocketModule
- Schedulers only enqueue work (delegate to Producer)
- Listeners fire-and-forget (log errors, never re-throw)
- DTOs always use class-validator + @ApiProperty
- Every controller uses @UseGuards(JwtAuthGuard) at class level
- Named exports only (no default exports)
- Never reference deleted modules: alerts, activations, images, sccon, statistics, supports
