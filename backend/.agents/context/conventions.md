# Conventions

Rules that apply across the entire backend codebase.

## DO

### Module Structure
- **One domain per folder** — `src/<domain>/` with `module.ts`, `controller.ts`, `dto/`, `services/`
- **Two module files per domain** — `<domain>.module.ts` (server, full) and `<domain>.cli-module.ts` (CLI, lightweight)
- **Register in `app.module.ts`** — every new server module goes in the imports array
- **Register in `model.module.ts`** — every new entity goes in the `features` array
- **Export from `model/index.ts`** — every new entity is barrel-exported

### API Design
- **DTOs with class-validator** — `@IsString()`, `@IsNumber()`, `@IsOptional()`, `@IsEnum()`
- **Swagger on all endpoints** — `@ApiTags()`, `@ApiOperation()`, `@ApiOkResponse()`, `@ApiBearerAuth()`
- **Response wrappers** — `ApiResponse<T>` for single, `ApiPaginatedResponse<T>` for lists
- **Pagination** — `page` + `limit` query params, return `total`, `totalPages`, `hasNext`, `hasPrev`

### Auth
- **`@Public()` decorator** — skip JWT auth on specific routes (login, forgot-password)
- **`@Roles(UserRole.ADMIN)` decorator** — gate by role
- **`@UseGuards(JwtAuthGuard)`** — on every controller by default

### Database
- **Migrations via TypeORM API** — `queryRunner.createTable()`, `createIndex()`, `createForeignKey()`
- **Schema `public`** — all tables in public schema
- **Entity registration** — in `model.module.ts` features array + `model/index.ts` barrel
- **Geo constants** — SRID via `getGeomSrid()` from env, not hardcoded

### CLI
- **CLI module is lightweight** — imports only ModelModule + services, NO Bull, NO WebSocket
- **Commands** — `@Command({ name: 'domain:verb-noun' })`, extends `CommandRunner`
- **Command class registered as provider** in the CLI module

### Queues
- **Jobs constants** — `src/<domain>/constants/<domain>.jobs.ts`, `as const`
- **Queue names** — from `QUEUES` constant in `queue.constants.ts`
- **Producers only enqueue** — never do the work themselves
- **Processors only dequeue** — call services, emit events on completion

### Events
- **Event constants** — `src/<domain>/events/<domain>.events.ts`, `as const`
- **Event classes** — plain public fields, no constructor
- **Listeners** — `@OnEvent(EVENT_CONSTANT)`, fire-and-forget, log errors, never re-throw

### Schedulers
- **Only enqueue** — schedulers delegate to Producers, never do work directly
- **Guard pattern** — `if (!this.isProduction) return` at top of every `@Cron` method
- **CronExpression enum** — `EVERY_HOUR`, `EVERY_DAY_AT_1AM`, etc.

### WebSocket
- **Gateway** — `@WebSocketGateway()`, `@SubscribeMessage()`
- **Auth** — JWT via `handshake.auth.token`, `WsJwtGuard`
- **Events bridge** — Listeners use `@OnEvent()` → `WebsocketService.emitToUser/Room()`

## DON'T

- **DON'T** use raw SQL in migrations (use `QueryRunner` API — `createTable`, `createIndex`, `createForeignKey`)
- **DON'T** add FK constraints on `user_roles` table (`createForeignKeyConstraints: false`)
- **DON'T** import `BullModule` or `WebsocketModule` in CLI modules
- **DON'T** do work directly in schedulers (delegate to Producer → Processor)
- **DON'T** re-throw errors in event listeners (fire-and-forget, log only)
- **DON'T** mix server module imports with CLI module imports
- **DON'T** reference deleted modules: `alerts`, `activations`, `images`, `sccon`, `statistics`, `supports`
- **DON'T** reference deleted entities: `Alert`, `AlertStatus`, `AlertActivation`, `Image`, `ScconAlertStatus`, etc.
- **DON'T** use default exports (use named exports)
- **DON'T** skip DTO validation (ValidationPipe is global)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Modules | PascalCase, `<Domain>Module` | `UsersModule` |
| CLI modules | PascalCase, `<Domain>CliModule` | `UsersCliModule` |
| Controllers | PascalCase, `<Domain>Controller` | `UsersController` |
| Services | PascalCase, `<Domain>Service` | `UsersService` |
| Entities | PascalCase, `<Domain>` | `User`, `Team`, `Comment` |
| DTOs | PascalCase, `<Verb><Noun>Dto` | `CreateUserDto`, `GetUsersQueryDto` |
| Commands | PascalCase, `<Verb><Noun>Command` | `SyncMetadataStatusCommand` |
| Producers | PascalCase, `<Domain>Producer` | `AlertsProducer` |
| Processors | PascalCase, `<Domain>Processor` | `AlertsProcessor` |
| Schedulers | PascalCase, `<Domain>Scheduler` | `AlertsScheduler` |
| Listeners | PascalCase, `<Event>Listener` | `CommentMentionListener` |
| Events | PascalCase, `<Action>Event` | `CommentCreatedEvent` |
| Event constants | UPPER_SNAKE_CASE | `COMMENT_EVENTS.CREATED` |
| Job constants | UPPER_SNAKE_CASE | `ALERTS_JOBS.AUDIT` |
| Queue names | PascalCase | `QUEUES.ALERTS` |
