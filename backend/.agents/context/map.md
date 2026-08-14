# Project Map

> One-line directory descriptions. Use this as an index to know where to create or edit files.

```
src/
├── main.ts                  → Bootstrap: dotenv, ValidationPipe, Swagger, CORS, listen
├── app.module.ts            → Root module (all server imports)
├── app.controller.ts        → Health check: GET /
├── app.service.ts           → Health check logic
├── app.types.ts             → Shared app-wide types
├── app.clients.ts           → CLI root module (lightweight, no Bull/WS)
├── cli.ts                   → CLI entry point (CommandFactory)
│
├── auth/                    → Authentication
│   ├── auth.module.ts       → Passport, JWT, MailModule
│   ├── auth.controller.ts   → POST login, GET me, POST forgot/reset-password
│   ├── auth.service.ts      → validateUser, login, forgotPassword, resetPassword
│   ├── auth.permissions.ts  → Role → Permission mapping
│   ├── auth.types.ts        → Auth-specific types
│   ├── decorators/            @Public(), @Roles()
│   ├── guards/                JwtAuthGuard, LocalAuthGuard, RolesGuard
│   ├── strategies/            JwtStrategy, LocalStrategy
│   └── dto/                   login, forgot-password, reset-password, auth-user, me
│
├── users/                   → User management
│   ├── users.module.ts
│   ├── users.controller.ts  → CRUD + findOnline
│   ├── services/            → UsersService (CRUD + password hashing)
│   ├── dto/                 → create, update, query, response, online
│   └── interceptors/        → NormalizeQueryParams
│
├── teams/                   → Team management
│   ├── teams.module.ts
│   ├── teams.controller.ts  → CRUD
│   ├── services/            → TeamsService (team + territory association)
│   ├── dto/                 → create, update, query, response, user
│   └── utils/               → team-territory helper
│
├── territories/             → Territory queries
│   ├── territories.module.ts
│   ├── territories.controller.ts  → GET list, GET by category
│   ├── services/            → TerritoriesService
│   └── dto/                 → query, response
│
├── comments/                → Generic comment system
│   ├── comments.module.ts
│   ├── comments.controller.ts  → CRUD by channel
│   ├── services/            → CommentsService (mentions, soft-delete)
│   └── dto/                 → create, query, response
│
├── notifications/           → Notification system
│   ├── notifications.module.ts
│   ├── notifications.controller.ts → GET list
│   ├── services/            → NotificationsService
│   ├── listeners/           → CommentMentionListener (in-app + email)
│   └── dto/                 → query, response
│
├── mail/                    → Email service
│   ├── mail.module.ts       → SMTP config, EJS adapter
│   ├── mail.service.ts      → sendResetPasswordEmail, sendMentionEmail
│   ├── mail-template.util.ts → Template resolution logic
│   └── templates/           → .ejs files (reset-password, comment-mention)
│
├── gee/                     → Google Earth Engine
│   ├── gee.module.ts
│   ├── gee.controller.ts    → Sentinel images, mosaics, time series
│   ├── services/            → GeeService, image providers, classifiers
│   ├── dto/                 → query, response DTOs
│   └── types/               → Enums: collections, bands, properties
│
├── config/                  → Application configuration
│   ├── app-config.module.ts
│   ├── app-config.controller.ts   → GET /api/app-config
│   ├── app-config.service.ts      → Composes config from JSON + env
│   ├── app-config.config.ts       → registerAs loader
│   ├── initiative-public-metadata.controller.ts → GET /api/initiative/public
│   ├── dto/                  → app-config, initiative-public-metadata
│   ├── initiatives/          → JSON config files per initiative
│   └── setup/               → jwt.config.ts, gee.config.ts, swagger.config.ts
│
├── model/                   → TypeORM entities + migrations
│   ├── model.module.ts      → TypeOrmModule.forRootAsync + forFeature
│   ├── model.enums.ts       → UserRole, NotificationType
│   ├── index.ts             → Barrel: entities + enums + module + config
│   ├── typeorm.config.ts    → createTypeOrmConfig factory
│   ├── typeorm.datasource.ts → DataSource for CLI
│   ├── geo.constants.ts     → GEOM_SRID resolver
│   ├── entities/            → 9 entity files (see entities.md)
│   └── migrations/          → 9 migration files (see entities.md)
│
├── shared/                  → Shared infrastructure modules
│   ├── redis/               → RedisModule (@Global), RedisService, keys, TTL constants
│   ├── gcs/                 → GcsModule (@Global), GcsService
│   └── utils/               → geotiff, png, rxjs-utils
│
├── queues/                  → Bull queue infrastructure
│   ├── queues.module.ts     → BullRootModule
│   ├── queues.config.ts     → Redis-backed Bull config
│   └── queue.constants.ts   → QUEUES object
│
└── websocket/               → Socket.io real-time
    ├── websocket.module.ts  → JwtModule, gateway + listeners
    ├── websocket.gateway.ts → Connection, rooms, presence
    ├── websocket.service.ts → emitToUser, emitToRoom, emitToAll
    ├── events/              → Event classes + constants (comment, notification)
    ├── listeners/           → @OnEvent → WS bridge (comment, notification)
    ├── guards/              → WsJwtGuard
    └── interfaces/          → AuthenticatedSocket
```
