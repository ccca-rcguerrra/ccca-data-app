# Quickstart

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm start:dev          # NestJS dev server with --watch (port 3000)
pnpm start:debug        # Dev server with --debug
pnpm build              # TypeScript build via nest build
pnpm start:prod         # node dist/main
```

## Quality

```bash
pnpm lint               # ESLint (flat config)
pnpm format             # Prettier
pnpm test               # Jest unit tests
pnpm test:watch         # Jest watch mode
pnpm test:cov           # Jest with coverage
pnpm test:e2e           # E2E tests (--config test/jest-e2e.json)
```

## Database (TypeORM)

```bash
pnpm typeorm migration:show                                                    # List pending
pnpm typeorm migration:generate -- -d src/model/typeorm.datasource.ts --pretty  # Generate
pnpm typeorm migration:create -- -d src/model/typeorm.datasource.ts            # Create empty
pnpm typeorm migration:run -- -d src/model/typeorm.datasource.ts               # Apply
pnpm typeorm migration:revert -- -d src/model/typeorm.datasource.ts            # Revert last
```

## CLI Commands

```bash
pnpm cli                                    # List available commands
pnpm cli <command>                          # Run a CLI command
```

## Environment

Key environment variables (see `.env.example` for full list):

```env
APP_PORT=3000
APP_AUTH_SECRET=<secret>
APP_DB_HOST=localhost
APP_DB_PORT=5432
APP_DB_NAME=workspace
APP_DB_USER=postgres
APP_DB_PASSWORD=<password>
APP_REDIS_HOST=localhost
APP_REDIS_PORT=6379
APP_SMTP_HOST=localhost
APP_SMTP_PORT=587
APP_INITIATIVE=default
APP_FRONTEND_URL=http://localhost:4200
```

## Project root commands

The monorepo root (`starterkit/`) contains both `backend/` and `frontend/`. Always run commands from the correct subdirectory:

| Task | Directory | Command |
|------|-----------|---------|
| Backend dev | `backend/` | `pnpm start:dev` |
| Backend test | `backend/` | `pnpm test` |
| Migration gen | `backend/` | `pnpm typeorm migration:generate -- -d ...` |
| CLI | `backend/` | `pnpm cli` |
| Frontend dev | `frontend/` | `pnpm start:dev` |
