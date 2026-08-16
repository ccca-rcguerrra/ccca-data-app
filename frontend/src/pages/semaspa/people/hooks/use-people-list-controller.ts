import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import { usePeopleQuery } from '@/hooks/api/use-semaspa';
import { personDetailPath } from '../components/person-link';
import { usePeopleListActions, usePeopleListState } from '../store/use-people-list-store';

export function usePeopleListController() {
  const navigate = useNavigate();
  const storeState = usePeopleListState();
  const storeActions = usePeopleListActions();

  const params = useMemo(
    () => ({
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: storeState.searchQuery.trim() || undefined,
    }),
    [storeState.currentPage, storeState.pageSize, storeState.searchQuery],
  );

  const query = usePeopleQuery(params);

  const handleSearchChange = useCallback(
    (searchQuery: string) => {
      storeActions.setSearchQuery(searchQuery);
    },
    [storeActions],
  );

  const handleOpenPerson = useCallback(
    (id: string) => {
      navigate(personDetailPath(id));
    },
    [navigate],
  );

  return {
    api: {
      people: query.data ?? {
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
      error: query.error,
      refetch: query.refetch,
    },
    store: { state: storeState, actions: storeActions },
    handlers: {
      handleSearchChange,
      handlePageChange: storeActions.setPage,
      handlePageSizeChange: storeActions.setPageSize,
      handleOpenPerson,
    },
  };
}

export type PeopleListController = ReturnType<typeof usePeopleListController>;
