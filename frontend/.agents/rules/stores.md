# Store Rules (Zustand)

Applies when working in `src/stores/` or `src/pages/*/store/`.

## Store Template (Persisted)

Use this for global stores that need persistence (auth, settings, filter state).

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { StorageService } from '@/services/storage/storage.service';
import { STORAGE_KEYS } from '@/constants/storage.constants';

interface DomainState {
  field: string;
  items: string[];
}

interface DomainActions {
  setField: (value: string) => void;
  addItem: (item: string) => void;
  removeItem: (item: string) => void;
  reset: () => void;
}

type DomainStore = DomainState & DomainActions;

const initialState: DomainState = {
  field: '',
  items: [],
};

export const useDomainStore = create<DomainStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setField: (value) => set({ field: value }),
      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),
      removeItem: (item) =>
        set((s) => ({ items: s.items.filter((i) => i !== item) })),
      reset: () => set({ ...initialState }),
    }),
    {
      name: STORAGE_KEYS.DOMAIN,
      storage: StorageService.createPersistStorage<DomainStore>(),
      partialize: (state) => ({
        field: state.field,
        items: state.items,
      }),
      version: 1,
      migrate: (_persisted, _version) => initialState,
    }
  )
);

export const useDomainState = () =>
  useDomainStore(useShallow((s) => ({ field: s.field, items: s.items })));

export const useDomainActions = () =>
  useDomainStore(
    useShallow((s) => ({
      setField: s.setField,
      addItem: s.addItem,
    }))
  );
```

## Store Template (Ephemeral)

Use this for page-scoped stores that should NOT persist (drawing state, modal visibility, active tab).

```typescript
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface PageState {
  hydratedId: number | null;
  isDrawerOpen: boolean;
  selectedIds: number[];
}

interface PageActions {
  setHydratedId: (id: number | null) => void;
  toggleDrawer: () => void;
  setSelectedIds: (ids: number[]) => void;
  reset: () => void;
}

type PageStore = PageState & PageActions;

const initialState: PageState = {
  hydratedId: null,
  isDrawerOpen: false,
  selectedIds: [],
};

export const usePageStore = create<PageStore>()((set) => ({
  ...initialState,
  setHydratedId: (id) => set({ hydratedId: id }),
  toggleDrawer: () => set((s) => ({ isDrawerOpen: !s.isDrawerOpen })),
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  reset: () => set({ ...initialState }),
}));
```

## Rules

| Rule | Why |
|------|-----|
| **`useShallow` for all selectors** | Prevents re-renders when only unrelated fields change |
| **State + Actions split** | Components that only read state don't re-render on action changes |
| **`initialState` as module const** | Clean `reset()` and `migrate()` without duplication |
| **`persist.partialize` always set** | Only persist user preferences and filter drafts, never transient UI |
| **`persist.version` + `migrate`** | Safe schema evolution for persisted data |
| **`StorageService.createPersistStorage()`** | Centralized localStorage access with quota recovery |
| **NEVER put API data in Zustand** | React Query is the cache. Zustand is for UI state only |
| **`STORAGE_KEYS` enum for names** | Avoid hardcoded strings that collide between stores |

## Persist vs Don't Persist

| Persist | Don't Persist |
|---------|---------------|
| User session (auth store) | Loading state |
| Theme, language (settings store) | Modal/drawer visibility |
| Filter drafts (list pages) | Active tab |
| Saved work (draft editing) | Drawing mode |
| Column layout (audit grid) | Selected IDs (except filter values) |
