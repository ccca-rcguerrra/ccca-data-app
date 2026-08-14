# Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | NestJS | ^11.1.19 | Server framework |
| Runtime | Node.js | 20+ | JavaScript runtime |
| Language | TypeScript | ^5.9.3 | Type checking |
| ORM | TypeORM | ^0.3.28 | Database abstraction |
| Database | PostgreSQL | via pg ^8.20.0 | Primary database |
| Cache | Redis | ^5.12.1 + @keyv/redis | Caching + session |
| Queues | Bull | ^4.16.5 + @nestjs/bull | Job queues |
| Auth | Passport + @nestjs/jwt | ^0.7.0, ^11.0.2 | JWT authentication |
| Validation | class-validator + class-transformer | ^0.15.1, ^0.5.1 | DTO validation |
| API Docs | @nestjs/swagger + swagger-ui-express | ^11.4.2 | OpenAPI documentation |
| WebSocket | Socket.io + @nestjs/platform-socket.io | ^4.8.3 | Real-time events |
| Events | @nestjs/event-emitter | ^3.1.0 | In-process events |
| Mail | @nestjs-modules/mailer + nodemailer + ejs | ^2.3.4, ^8.0.7, ^5.0.2 | Email delivery |
| GEE | @google/earthengine | 1.7.25 | Google Earth Engine |
| Storage | @google-cloud/storage | ^7.19.0 | Google Cloud Storage |
| CLI | nest-commander | ^3.20.1 | CLI commands |
| Security | helmet + express-rate-limit + csrf-csrf | ^8.1.0, ^8.4.1, ^4.0.3 | HTTP security |
| HTTP | @nestjs/axios | ^4.0.1 | HTTP client |
| Geospatial | @turf/turf | ^7.3.5 | GeoJSON utilities |
| Compression | compression | ^1.8.1 | Response compression |
| Dates | date-fns | ^4.1.0 | Date manipulation |

## Key Configurations

| Config | Value |
|--------|-------|
| Dev port | 3000 (or `WS_BACKEND_PORT`) |
| Body limit | 20mb (json + urlencoded) |
| Swagger | `/api` endpoint |
| ValidationPipe | `whitelist: true, forbidNonWhitelisted: true, transform: true` |
| CORS | `app.enableCors()` (all origins) |
| Prettier | semicolons, single quotes, 80 width |
| ESLint | Flat config (v10) |
| Dotenv | `import 'dotenv/config'` at import time in main.ts |
