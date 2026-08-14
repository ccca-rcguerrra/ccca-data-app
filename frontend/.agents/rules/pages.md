# Page Rules

Applies when working in `src/pages/`.

## Directory Structure

Every page follows this layout:

```
pages/<domain>/<feature>/
├── <feature>-page.tsx              # Page component (pure render, 4 states)
├── hooks/
│   └── use-<feature>-controller.ts # Single controller hook (all logic)
├── store/
│   └── use-<feature>-store.ts      # Zustand store (page-scoped, persisted only for filters)
├── components/                     # Page-specific components (optional)
│   ├── <feature>-sidebar.tsx
│   ├── <feature>-table.tsx
│   └── ...
└── utils/                          # Page-specific helpers (optional)
```

## Page Component (4-State Rule)

Every page MUST render exactly 4 states in this order. No exceptions.

```typescript
export const FeaturePage = () => {
  const { id } = useParams();
  const controller = useFeatureController({ id });

  // STATE 1: Invalid ID
  if (!controller.isValidId) {
    return <Alert variant="destructive"><AlertCircle />Invalid ID</Alert>;
  }

  // STATE 2: Loading (skeleton)
  if (controller.api.isLoading) {
    return <FeatureSkeleton />;
  }

  // STATE 3: Error
  if (controller.api.isError || !controller.api.data) {
    return (
      <Alert variant="destructive">
        <AlertCircle />
        {controller.api.error?.message ?? 'Failed to load'}
      </Alert>
    );
  }

  // STATE 4: Content
  return (
    <div className="flex h-full">
      <div className="flex-1">{/* Main content */}</div>
      <FeatureSidebar controller={controller} />
    </div>
  );
};
```

## Controller Hook

One hook per page. All business logic, event handlers, and state composition happens here. The page component only renders.

```typescript
export function useFeatureController({ id }: { id?: number }) {
  // Route params
  const isValidId = id != null && !isNaN(id);

  // Server state (React Query)
  const query = useFeatureQuery(id, { enabled: isValidId });

  // Client state (Zustand)
  const storeState = useFeatureStore(useShallow((s) => ({ ... })));
  const storeActions = useFeatureStore(useShallow((s) => ({ ... })));

  // Hydration (one-time, guarded)
  useEffect(() => {
    if (!isValidId) return;
    if (storeState.hydratedId === id) return;
    if (!query.data) return;
    storeActions.hydrate(query.data);
    storeActions.setHydratedId(id);
  }, [isValidId, id, query.data, storeState.hydratedId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { storeActions.reset(); };
  }, []);

  // Handlers
  const handleSave = useCallback(async (data: FormData) => {
    await mutation.mutateAsync(data);
  }, [mutation]);

  return {
    isValidId,
    api: {
      data: query.data ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
    },
    store: { state: storeState, actions: storeActions },
    handlers: { handleSave },
  };
}
```

## Store (Page-Level)

Page stores are ephemeral by default. Persist only filter state.

```typescript
interface FeatureState {
  hydratedId: number | null;
  activeTab: string;
  // ... page-specific state
}

interface FeatureActions {
  setHydratedId: (id: number | null) => void;
  setActiveTab: (tab: string) => void;
  hydrate: (data: ApiData) => void;
  reset: () => void;
}

type FeatureStore = FeatureState & FeatureActions;

const initialState: FeatureState = {
  hydratedId: null,
  activeTab: 'images',
};

export const useFeatureStore = create<FeatureStore>()(
  persist(                          // persist only if storing filters
    (set) => ({
      ...initialState,
      setHydratedId: (id) => set({ hydratedId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      hydrate: (data) => set({ ...data }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: STORAGE_KEYS.FEATURE,
      partialize: (s) => ({ /* persist only filters here */ }),
      version: 1,
      migrate: () => initialState,
    }
  )
);

export const useFeatureState = () =>
  useFeatureStore(useShallow((s) => ({ activeTab: s.activeTab })));

export const useFeatureActions = () =>
  useFeatureStore(useShallow((s) => ({ setActiveTab: s.setActiveTab })));
```

## New Page Checklist

When creating a new page, you MUST also:
1. Add route to `constants/routes.constants.ts` (ROUTES object)
2. Add route to `routes.tsx` (with `ProtectedRoute` wrapper)
3. Add navigation item to `navigation.ts` (with `permission` and `feature` flags)
4. Add i18n keys to `en-US.json` for titles, labels, errors
5. Lazy-load if the page is heavy (use `React.lazy`)
