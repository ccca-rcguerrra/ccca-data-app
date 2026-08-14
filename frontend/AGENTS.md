# Frontend — Agent Guide

@.agents/context/quickstart.md
@.agents/context/map.md
@.agents/context/stack.md
@.agents/context/conventions.md

## Domain Rules

@.agents/rules/pages.md
@.agents/rules/stores.md
@.agents/rules/services.md
@.agents/rules/components.md

## Templates

Copy full working code from `.agents/templates/` when creating new files:
- `page.tsx` — Page component with 4 states (Invalid → Skeleton → Error → Content)
- `controller.ts` — Controller hook returning `{ api, store, handlers }`
- `store-global.ts` — Zustand store with persistence
- `store-page.ts` — Zustand store without persistence
- `service.ts` — Static API service class
- `query-hooks.ts` — React Query hooks (queryOptions, useQuery, useMutation)
- `form.tsx` — react-hook-form + zod form component
- `component.tsx` — Reusable component with loading/error/empty states
