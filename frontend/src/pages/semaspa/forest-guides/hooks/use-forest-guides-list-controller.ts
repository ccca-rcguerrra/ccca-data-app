import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';

import { useForestGuidesQuery } from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';
import type { ForestGuideListParams } from '@/types/semaspa';
import {
  useForestGuidesListActions,
  useForestGuidesListState,
  type ForestGuidesAdvancedFilters,
} from '../store/use-forest-guides-list-store';

function hasAdvancedValues(filters: ForestGuidesAdvancedFilters): boolean {
  return Boolean(
    filters.issuedFrom ||
      filters.issuedTo ||
      filters.autefId.trim() ||
      filters.taxId.trim() ||
      filters.personName.trim() ||
      filters.plate.trim() ||
      filters.scientificName.trim() ||
      filters.commonName.trim(),
  );
}

export function useForestGuidesListController() {
  const storeState = useForestGuidesListState();
  const storeActions = useForestGuidesListActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const listParams = useMemo((): ForestGuideListParams => {
    const quick = storeState.quickFilters;
    const advanced = storeState.advancedApplied;
    const autefIdRaw = advanced.autefId.trim();
    const autefId = autefIdRaw ? Number(autefIdRaw) : undefined;

    return {
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: quick.searchQuery.trim() || undefined,
      status: quick.status.trim() || undefined,
      type: quick.type.trim() || undefined,
      issuedFrom: advanced.issuedFrom || undefined,
      issuedTo: advanced.issuedTo || undefined,
      autefId:
        autefId != null && Number.isInteger(autefId) && autefId > 0 ? autefId : undefined,
      taxId: advanced.taxId.trim() || undefined,
      personName: advanced.personName.trim() || undefined,
      plate: advanced.plate.trim() || undefined,
      scientificName: advanced.scientificName.trim() || undefined,
      commonName: advanced.commonName.trim() || undefined,
    };
  }, [
    storeState.currentPage,
    storeState.pageSize,
    storeState.quickFilters,
    storeState.advancedApplied,
  ]);

  const query = useForestGuidesQuery(listParams);
  const pagination = query.data
    ? {
        page: query.data.page,
        limit: query.data.limit,
        total: query.data.total,
        totalPages: query.data.totalPages,
        hasNext: query.data.hasNext,
        hasPrev: query.data.hasPrev,
      }
    : null;

  const hasActiveFilters = useMemo(() => {
    const quick = storeState.quickFilters;
    return Boolean(
      quick.searchQuery.trim() ||
        quick.status.trim() ||
        quick.type.trim() ||
        hasAdvancedValues(storeState.advancedApplied),
    );
  }, [storeState.quickFilters, storeState.advancedApplied]);

  useEffect(() => {
    const plate = searchParams.get('plate')?.trim() ?? '';
    if (plate) storeActions.hydratePlateFilter(plate);
    return () => {
      storeActions.reset();
    };
  }, [searchParams, storeActions]);

  return {
    api: {
      rows: query.data?.data ?? [],
      pagination,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      hasActiveFilters,
      totalPages: pagination?.totalPages ?? 1,
    },
    store: { state: storeState, actions: storeActions },
    handlers: {
      handleQuickFilterChange: useCallback(
        (filters: Partial<typeof storeState.quickFilters>) => {
          storeActions.setQuickFilters(filters);
        },
        [storeActions],
      ),
      handleAdvancedInputChange: useCallback(
        (filters: Partial<typeof storeState.advancedInputs>) => {
          storeActions.setAdvancedInputs(filters);
        },
        [storeActions],
      ),
      handleApplyAdvancedFilters: useCallback(() => {
        storeActions.applyAdvancedFilters();
      }, [storeActions]),
      handleToggleAdvanced: useCallback(
        (open?: boolean) => {
          if (typeof open === 'boolean') {
            storeActions.setAdvancedOpen(open);
            return;
          }
          storeActions.setAdvancedOpen(!storeState.advancedOpen);
        },
        [storeActions, storeState.advancedOpen],
      ),
      handleClearFilters: useCallback(() => {
        storeActions.clearFilters();
      }, [storeActions]),
      handlePageSizeChange: useCallback(
        (size: number) => storeActions.setPageSize(size),
        [storeActions],
      ),
      handlePageChange: useCallback(
        (page: number) => storeActions.setPage(page),
        [storeActions],
      ),
      handleRowClick: useCallback(
        (id: number) => {
          navigate(ROUTES.semaspa.forestGuideDetail.replace(':id', String(id)));
        },
        [navigate],
      ),
    },
  };
}

export type ForestGuidesListController = ReturnType<typeof useForestGuidesListController>;
