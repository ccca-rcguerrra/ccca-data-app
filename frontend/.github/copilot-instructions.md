# Workspace Frontend — Copilot Instructions

React 18 + Vite 6 + Tailwind CSS v4 + shadcn/ui (new-york style) + Zustand 5 + React Query v5 + React Router v7.

## Project knowledge

All patterns, conventions, and templates are documented in `.agents/`. Load the following before writing code:

1. `.agents/context/conventions.md` — Universal DO/DON'T, naming, imports
2. `.agents/context/map.md` — Directory structure (where to put files)
3. `.agents/context/stack.md` — Exact versions of all dependencies
4. `.agents/rules/pages.md` — Page architecture (4-state pattern, controller hook)
5. `.agents/rules/stores.md` — Zustand store templates
6. `.agents/rules/services.md` — API service + React Query patterns
7. `.agents/rules/components.md` — Component patterns and rules

Full copy-paste code templates at `.agents/templates/`.

## Key constraints

- NEVER put API data in Zustand (use React Query cache)
- Pages MUST render 4 states: Invalid → Skeleton → Error → Content
- Use `@/` path alias for all internal imports
- Import types with `import type` (verbatimModuleSyntax enforces this)
- All localStorage access through StorageService (ESLint enforced)
- Services are static classes, never instantiated
- Query keys use factory functions from QUERY_KEYS
- Use cn() from @/lib/utils for className merging
- All user-facing strings must be i18n'd via t('namespace.key')
