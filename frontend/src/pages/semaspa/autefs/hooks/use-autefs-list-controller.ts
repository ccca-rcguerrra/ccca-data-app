import { useNavigate } from 'react-router';
import { useCallback, useEffect, useMemo } from 'react';

import type { AutefListParams } from '@/types/semaspa';
import { useAutefsQuery } from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';

import {
  useAutefsListActions,
  useAutefsListState,
  type AutefsAdvancedFilters,
} from '../store/use-autefs-list-store';

function parseOptionalInt(value: string, min?: number, max?: number): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed)) return undefined;
  if (min != null && parsed < min) return undefined;
  if (max != null && parsed > max) return undefined;
  return parsed;
}

function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return parsed;
}

function hasAdvancedValues(filters: AutefsAdvancedFilters): boolean {
  return Boolean(
    filters.issueMonth.trim() ||
      filters.processNumber.trim() ||
      filters.issuedFrom ||
      filters.issuedTo ||
      filters.taxId.trim() ||
      filters.personName.trim() ||
      filters.isOverExtracted ||
      filters.hasForestGuide !== null ||
      filters.movedRatioMin.trim() ||
      filters.movedRatioMax.trim() ||
      filters.speciesProductId.trim() ||
      filters.scientificName.trim() ||
      filters.commonName.trim(),
  );
}

/**
 * Orchestrates AUTEFs list: React Query + Zustand store + handlers.
 * Returns { api, store, handlers }.
 */
export function useAutefsListController() {
  const storeState = useAutefsListState();
  const storeActions = useAutefsListActions();
  const navigate = useNavigate();

  const listParams = useMemo((): AutefListParams => {
    const quick = storeState.quickFilters;
    const advanced = storeState.advancedApplied;
    const issueYear = parseOptionalInt(quick.issueYear, 1900, 2100);
    const issueMonth = parseOptionalInt(advanced.issueMonth, 1, 12);
    const movedRatioMin = parseOptionalFloat(advanced.movedRatioMin);
    const movedRatioMax = parseOptionalFloat(advanced.movedRatioMax);

    return {
      page: storeState.currentPage,
      limit: storeState.pageSize,
      search: quick.searchQuery.trim() || undefined,
      city: quick.city.trim() || undefined,
      state: quick.state.trim() || undefined,
      issueYear,
      issueMonth,
      processNumber: advanced.processNumber.trim() || undefined,
      issuedFrom: advanced.issuedFrom || undefined,
      issuedTo: advanced.issuedTo || undefined,
      taxId: advanced.taxId.trim() || undefined,
      personName: advanced.personName.trim() || undefined,
      isOverExtracted: advanced.isOverExtracted || undefined,
      hasForestGuide:
        advanced.hasForestGuide === null ? undefined : advanced.hasForestGuide,
      movedRatioMin,
      movedRatioMax,
      speciesProductId: advanced.speciesProductId.trim() || undefined,
      scientificName: advanced.scientificName.trim() || undefined,
      commonName: advanced.commonName.trim() || undefined,
    };
  }, [
    storeState.currentPage,
    storeState.pageSize,
    storeState.quickFilters,
    storeState.advancedApplied,
  ]);

  const autefsQuery = useAutefsQuery(listParams);

  const pagination = autefsQuery.data
    ? {
        page: autefsQuery.data.page,
        limit: autefsQuery.data.limit,
        total: autefsQuery.data.total,
        totalPages: autefsQuery.data.totalPages,
        hasNext: autefsQuery.data.hasNext,
        hasPrev: autefsQuery.data.hasPrev,
      }
    : null;

  const rows = autefsQuery.data?.data ?? [];

  const hasActiveFilters = useMemo(() => {
    const quick = storeState.quickFilters;
    return Boolean(
      quick.searchQuery.trim() ||
        quick.city.trim() ||
        quick.state.trim() ||
        quick.issueYear.trim() ||
        hasAdvancedValues(storeState.advancedApplied),
    );
  }, [storeState.quickFilters, storeState.advancedApplied]);

  const showOverExtractedBadge = storeState.advancedApplied.isOverExtracted;

  useEffect(() => {
    return () => {
      storeActions.reset();
    };
  }, [storeActions]);

  const handleQuickFilterChange = useCallback(
    (filters: Partial<typeof storeState.quickFilters>) => {
      storeActions.setQuickFilters(filters);
    },
    [storeActions],
  );

  const handleAdvancedInputChange = useCallback(
    (filters: Partial<typeof storeState.advancedInputs>) => {
      storeActions.setAdvancedInputs(filters);
    },
    [storeActions],
  );

  const handleApplyAdvancedFilters = useCallback(() => {
    storeActions.applyAdvancedFilters();
  }, [storeActions]);

  const handleToggleAdvanced = useCallback(
    (open?: boolean) => {
      if (typeof open === 'boolean') {
        storeActions.setAdvancedOpen(open);
        return;
      }
      storeActions.setAdvancedOpen(!storeState.advancedOpen);
    },
    [storeActions, storeState.advancedOpen],
  );

  const handleClearFilters = useCallback(() => {
    storeActions.clearFilters();
  }, [storeActions]);

  const handleOverExtractedToggle = useCallback(
    (value: boolean) => {
      storeActions.setOverExtractedFilter(value);
    },
    [storeActions],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      storeActions.setPageSize(size);
    },
    [storeActions],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      storeActions.setPage(page);
    },
    [storeActions],
  );

  const handleRowClick = useCallback(
    (id: number) => {
      navigate(ROUTES.semaspa.autefDetail.replace(':id', String(id)));
    },
    [navigate],
  );

  return {
    api: {
      rows,
      pagination,
      isLoading: autefsQuery.isLoading,
      isFetching: autefsQuery.isFetching,
      isError: autefsQuery.isError,
      error: autefsQuery.error,
      refetch: autefsQuery.refetch,
      hasActiveFilters,
      showOverExtractedBadge,
      totalPages: pagination?.totalPages ?? 1,
    },
    store: {
      state: storeState,
      actions: storeActions,
    },
    handlers: {
      handleQuickFilterChange,
      handleAdvancedInputChange,
      handleApplyAdvancedFilters,
      handleToggleAdvanced,
      handleClearFilters,
      handleOverExtractedToggle,
      handlePageSizeChange,
      handlePageChange,
      handleRowClick,
    },
  };
}

export type AutefsListController = ReturnType<typeof useAutefsListController>;
