# Service + React Query Rules

Applies when working in `src/services/` or `src/hooks/api/`.

## Service Class Pattern

All API services follow this exact template. Static class, no instantiation.

```typescript
import { api } from '@/services/api';
import type { ApiResponse, ApiPaginatedResponse } from '@/types/api';
import type { DomainItem, DomainListParams, CreateDomainDto } from '@/types/domain';

export class DomainService {
  private static readonly BASE_URL = '/api/domain';

  static async findAll(
    params?: DomainListParams,
  ): Promise<ApiPaginatedResponse<DomainItem>> {
    const response = await api.get<
      ApiPaginatedResponse<DomainItem>
    >(DomainService.BASE_URL, { params });
    return response.data;
  }

  static async findOne(id: number): Promise<ApiResponse<DomainItem>> {
    const response = await api.get<ApiResponse<DomainItem>>(
      `${DomainService.BASE_URL}/${id}`,
    );
    return response.data;
  }

  static async create(dto: CreateDomainDto): Promise<ApiResponse<DomainItem>> {
    const response = await api.post<ApiResponse<DomainItem>>(
      DomainService.BASE_URL,
      dto,
    );
    return response.data;
  }

  static async update(
    id: number,
    dto: Partial<CreateDomainDto>,
  ): Promise<ApiResponse<DomainItem>> {
    const response = await api.patch<ApiResponse<DomainItem>>(
      `${DomainService.BASE_URL}/${id}`,
      dto,
    );
    return response.data;
  }

  static async remove(id: number): Promise<void> {
    await api.delete(`${DomainService.BASE_URL}/${id}`);
  }
}
```

## React Query Hooks

### Query Options Factory

Always export a `queryOptions()` factory for reusable query config:

```typescript
export const domainQueryOptions = (id: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.domain.detail(id),
    queryFn: () => DomainService.findOne(id),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes
  });
```

### useQuery Hook

```typescript
export function useDomainQuery(id: number) {
  return useQuery(domainQueryOptions(id));
}
```

### useMutation Hook

```typescript
export function useCreateDomainMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateDomainDto) => DomainService.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.domain.list(),
      });
    },
  });
}
```

## Query Key Factory

All query keys use factory functions returning `as const` tuples:

```typescript
export const QUERY_KEYS = {
  domain: {
    all: () => ['domain'] as const,
    list: (params?: DomainListParams) =>
      ['domain', 'list', params ?? {}] as const,
    detail: (id: number) => ['domain', 'detail', id] as const,
  },
};
```

## Cache Strategies

| Data Type | staleTime | gcTime | Why |
|-----------|-----------|--------|-----|
| App config | Infinity | Infinity | Never changes without deploy |
| Auth user (me) | 5 min | 10 min | Changes on login/logout/update |
| Entity detail | 5 min | 10 min | Changes on update |
| List (paginated) | 2 min | 5 min | Changes when others create/edit |
| Online users | Infinity | 1 hour | WebSocket-driven (cache only) |
| Reference data | 30 min | 1 hour | Territories, sources (rarely change) |

## Rules

| Rule | Why |
|------|-----|
| **Services are static classes** | No state, no DI — simple function wrappers |
| **Response types from `ApiResponse<T>`** | Consistent unwrapping: `response.data.data` |
| **Query keys are tuples `as const`** | TypeScript infers exact types for invalidation |
| **`queryOptions()` factories** | Reusable across components, testable |
| **Invalidate on mutation success** | Keep cache in sync after writes |
| **Use `setQueryData` for optimistic updates** | Instant UI feedback before server confirms |
| **Services never import stores** | Services are pure HTTP, no side effects |
| **Hooks access stores via `useAuthStore`** | Get auth token from Zustand, not props |
