# Conventions

Rules that apply across the entire frontend codebase.

## DO

### Imports
- **`@/` path alias** for all internal imports (never relative paths beyond `./` or `../`)
- **`import type`** for type-only imports (`verbatimModuleSyntax` enforces this)
- **Import order** (ESLint enforced): builtin → external → internal → parent → sibling → index, alphabetically descending, newlines between groups

```typescript
import { useState } from 'react';                          // builtin
import { useQuery } from '@tanstack/react-query';           // external
import { useAuthStore } from '@/stores';                    // internal (@/)
import { UserService } from '../services/users.service';    // parent (../)
import { formatDate } from './utils';                       // sibling (./)
```

### State Management
- **Server data ALWAYS in React Query** — never store API responses in Zustand
- **UI state in Zustand** — filters, selections, modal visibility, tabs, drawing mode
- **localStorage only through StorageService** — ESLint `no-restricted-globals` enforces this

### Pages
- **Controller pattern mandatory** — every page uses a single `use*Controller()` hook
- **4 states in order** — Invalid → Skeleton → Error → Content (never skip)
- **Props drilling limited to controller** — page passes `controller` prop to children

### Components
- **cn() for className** — from `@/lib/utils`, merges Tailwind classes safely
- **Shared components** in `src/components/`, page-specific in `src/pages/<domain>/components/`
- **Props interface in same file** unless shared by 3+ components

### Forms
- **react-hook-form + zod** — always define schema first, then form
- **Controlled inputs** — use `form.register()` never manual state

### i18n
- **All user-facing strings internationalized** — add key to `en-US.json`, use `t('namespace.key')`
- **Keys follow dot notation** — `domain.page.element` (e.g. `users.management.columns.name`)

## DON'T

- **DON'T** put API response data in Zustand (use React Query cache)
- **DON'T** skip the 4-state page pattern (Invalid → Skeleton → Error → Content)
- **DON'T** access `localStorage` directly (use `StorageService`)
- **DON'T** create a page without a controller hook
- **DON'T** use `import React` (JSX transform is `react-jsx`)
- **DON'T** use default exports (use named exports)
- **DON'T** hardcode query keys as strings (use `QUERY_KEYS` factory)
- **DON'T** reference deleted modules: `alerts`, `supports`, `statistics`, `working`, `activations`, `images` (domain), `alert-classes`, `audit-reasons`, `geometry-styles` (constants)

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Pages | PascalCase, `<Domain><Feature>Page` | `UsersManagementPage` |
| Controller hooks | `use<Domain><Feature>Controller` | `useUsersManagementController` |
| Stores | `use<Domain><Feature>Store` | `useUsersManagementStore` |
| Services | PascalCase, `<Domain>Service` | `UsersService` |
| Query hooks | `use<Domain>Query` / `use<Domain>Mutation` | `useUsersQuery`, `useDeleteUserMutation` |
| Components | PascalCase, descriptive | `UserFormModal`, `UsersManagementTable` |
| Types | PascalCase, descriptive | `User`, `CreateUserDto`, `UsersListParams` |
| Constants | UPPER_SNAKE_CASE | `ROUTES`, `QUERY_KEYS`, `STORAGE_KEYS` |
