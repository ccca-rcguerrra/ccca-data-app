# Quickstart

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm start:dev          # Dev server → http://localhost:4200
pnpm build              # TypeScript check + Vite production build
pnpm preview            # Preview production build locally
```

## Quality

```bash
pnpm lint               # ESLint (flat config)
pnpm lint:fix           # Auto-fix lint issues
pnpm format             # Prettier
pnpm format:check       # Check formatting without writing
pnpm i18n:check         # Validate translation JSON structure
```

## UI Components (shadcn/ui)

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components install to `src/components/ui/shadcn/`. Available: alert, avatar, badge, breadcrumb, button, calendar, card, carousel, checkbox, collapsible, command, dialog, dropdown-menu, input, label, popover, scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, tooltip.

## Environment

```env
VITE_API_BASE_URL=http://localhost:3000    # Backend API base URL
VITE_WS_URL=                               # WebSocket URL (falls back to VITE_API_BASE_URL)
```

## Project root commands

The monorepo root (`starterkit/`) contains both `backend/` and `frontend/`. Always run commands from the correct subdirectory:

| Task | Directory | Command |
|------|-----------|---------|
| Frontend dev | `frontend/` | `pnpm start:dev` |
| Frontend build | `frontend/` | `pnpm build` |
| Backend dev | `backend/` | `pnpm start:dev` |
| Backend build | `backend/` | `pnpm build` |
