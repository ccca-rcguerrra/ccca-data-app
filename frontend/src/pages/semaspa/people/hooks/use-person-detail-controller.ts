import { useParams } from 'react-router';
import { useCallback, useEffect, useMemo } from 'react';

import type { PersonParticipation } from '@/types/semaspa';
import type { ApiPaginatedResponse } from '@/types/api';
import {
  usePersonAutefsQuery,
  usePersonForestGuidesQuery,
  usePersonParticipationQuery,
  usePersonQuery,
} from '@/hooks/api/use-semaspa';
import {
  usePersonDetailActions,
  usePersonDetailState,
  type PersonDetailTabId,
} from '../store/use-person-detail-store';

function emptyPagination<T>(): ApiPaginatedResponse<T> {
  return {
    data: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  };
}

const EMPTY_PARTICIPATION: PersonParticipation = {
  ownerAutefCount: 0,
  technicalResponsibleAutefCount: 0,
  analystAutefCount: 0,
  originGfCount: 0,
  destinationGfCount: 0,
  distinctAutefCount: 0,
  distinctGfCount: 0,
};

export function usePersonDetailController() {
  const params = useParams<{ id: string }>();
  const personId = params.id ? decodeURIComponent(params.id) : '';
  const validId = personId.length > 0;

  const storeState = usePersonDetailState();
  const storeActions = usePersonDetailActions();
  const { activeTab, tabs } = storeState;

  const personQuery = usePersonQuery(personId, validId);
  const participationQuery = usePersonParticipationQuery(personId, validId);

  const autefsParams = useMemo(
    () => ({ page: tabs.autefs.page, limit: tabs.autefs.pageSize }),
    [tabs.autefs.page, tabs.autefs.pageSize],
  );
  const forestGuidesParams = useMemo(
    () => ({ page: tabs.forestGuides.page, limit: tabs.forestGuides.pageSize }),
    [tabs.forestGuides.page, tabs.forestGuides.pageSize],
  );

  const autefsQuery = usePersonAutefsQuery(personId, autefsParams, {
    enabled: validId && activeTab === 'autefs',
  });
  const forestGuidesQuery = usePersonForestGuidesQuery(personId, forestGuidesParams, {
    enabled: validId && activeTab === 'forestGuides',
  });

  useEffect(() => {
    storeActions.reset();
    return () => {
      storeActions.reset();
    };
  }, [personId, storeActions]);

  const handleActiveTabChange = useCallback(
    (tab: string) => {
      storeActions.setActiveTab(tab as PersonDetailTabId);
    },
    [storeActions],
  );

  return {
    api: {
      personId,
      validId,
      person: personQuery.data ?? null,
      isLoadingPerson: personQuery.isLoading,
      isErrorPerson: personQuery.isError,
      errorPerson: personQuery.error,
      isNotFound:
        personQuery.isError &&
        (personQuery.error as { response?: { status?: number } })?.response?.status === 404,
      participation: participationQuery.data ?? EMPTY_PARTICIPATION,
      isLoadingParticipation: participationQuery.isLoading,
      autefs: autefsQuery.data ?? emptyPagination(),
      isLoadingAutefs: autefsQuery.isLoading || autefsQuery.isFetching,
      forestGuides: forestGuidesQuery.data ?? emptyPagination(),
      isLoadingForestGuides: forestGuidesQuery.isLoading || forestGuidesQuery.isFetching,
    },
    store: { state: storeState, actions: storeActions },
    handlers: {
      handleActiveTabChange,
      handleTabPageChange: storeActions.setTabPage,
      handleTabPageSizeChange: storeActions.setTabPageSize,
    },
  };
}

export type PersonDetailController = ReturnType<typeof usePersonDetailController>;
