import { useEffect, useCallback, useMemo } from 'react';
import { useFeatureStore, useFeatureState, useFeatureActions } from '../store/use-feature-store';

interface UseFeatureControllerParams {
  id?: number;
}

export function useFeatureController({ id }: UseFeatureControllerParams) {
  const isValidId = id != null && !isNaN(id);

  // Server state (add your React Query hooks here)
  // const query = useFeatureQuery(id, { enabled: isValidId });
  // const mutation = useSaveFeatureMutation();

  // Client state (Zustand)
  const storeState = useFeatureState();
  const storeActions = useFeatureActions();

  // Hydration guard — only hydrate once when data arrives
  useEffect(() => {
    if (!isValidId) return;
    if (storeState.hydratedId === id) return;
    // if (!query.data) return;

    // storeActions.hydrate(query.data);
    storeActions.setHydratedId(id);
  }, [isValidId, id, storeState.hydratedId]);

  // Cleanup on unmount — reset ephemeral state
  useEffect(() => {
    return () => {
      storeActions.reset();
    };
  }, []);

  // Event handlers (useCallback to avoid re-renders)
  const handleSave = useCallback(
    async (data: unknown) => {
      // await mutation.mutateAsync(data);
    },
    [],
  );

  const handleCancel = useCallback(() => {
    storeActions.reset();
  }, [storeActions]);

  // Computed values (useMemo for derived state)
  const hasPendingChanges = useMemo(() => {
    return false; // Compare current state with initial
  }, []);

  return {
    alertId: id,
    isValidId,
    api: {
      isLoading: false,
      isError: false,
      error: null as Error | null,
      data: null,
      refetch: () => {},
    },
    store: {
      state: storeState,
      actions: storeActions,
      hasPendingChanges,
    },
    handlers: {
      handleSave,
      handleCancel,
    },
  };
}
