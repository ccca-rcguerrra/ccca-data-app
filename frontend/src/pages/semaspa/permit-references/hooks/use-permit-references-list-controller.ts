import { useMemo } from 'react';

import { usePermitReferencesQuery } from '@/hooks/api/use-semaspa';
import type { PermitReferenceListParams } from '@/types/semaspa';
import {
  usePermitReferencesListActions,
  usePermitReferencesListState,
} from '../store/use-permit-references-list-store';

export function usePermitReferencesListController() {
  const storeState = usePermitReferencesListState();
  const storeActions = usePermitReferencesListActions();

  const params = useMemo((): PermitReferenceListParams => {
    return {
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: storeState.searchQuery.trim() || undefined,
      matchStatus: storeState.matchStatus || undefined,
      type: storeState.type.trim() || undefined,
      issuedFrom: storeState.issuedFrom || undefined,
      issuedTo: storeState.issuedTo || undefined,
      multiple: storeState.multiple || undefined,
    };
  }, [storeState]);

  const query = usePermitReferencesQuery(params);

  return {
    api: {
      rows: query.data ?? {
        data: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      isLoading: query.isLoading || query.isFetching,
      isError: query.isError,
      refetch: query.refetch,
    },
    store: { state: storeState, actions: storeActions },
  };
}

export type PermitReferencesListController = ReturnType<
  typeof usePermitReferencesListController
>;
