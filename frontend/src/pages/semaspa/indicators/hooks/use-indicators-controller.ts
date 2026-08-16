import { useNavigate, useSearchParams } from 'react-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import {
  ANY_INDICATOR_ID,
  type CatalogIndicatorId,
  type IndicatorCasesParams,
  type IndicatorQueryId,
} from '@/types/semaspa';
import { IndicatorsService } from '@/services/semaspa/indicators.service';
import {
  useIndicatorCasesQuery,
  useIndicatorSummaryQuery,
} from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';
import { personDetailPath } from '../../people/components/person-link';

import {
  useIndicatorsActions,
  useIndicatorsState,
  type IndicatorCenterFilters,
} from '../store/use-indicators-store';
import {
  buildIndicatorSearchParams,
  indicatorSearchParamsEqual,
  parseIndicatorSearchParams,
  toApiFilters,
} from '../lib/indicator-url-state';

const SEARCH_DEBOUNCE_MS = 350;

function hasFilterValues(filters: IndicatorCenterFilters): boolean {
  return Object.values(filters).some((value) => value.trim().length > 0);
}

export function useIndicatorsController() {
  const storeState = useIndicatorsState();
  const storeActions = useIndicatorsActions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const landingSearchParams = useRef(searchParams);
  const hydratedRef = useRef(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useLayoutEffect(() => {
    storeActions.applySnapshot(parseIndicatorSearchParams(landingSearchParams.current));
    hydratedRef.current = true;
    return () => {
      storeActions.reset();
    };
  }, [storeActions]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    const next = buildIndicatorSearchParams(
      storeState.selectedIndicatorId,
      storeState.filters,
    );
    if (!indicatorSearchParamsEqual(next, searchParams)) {
      setSearchParams(next, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    storeState.filters,
    storeState.selectedIndicatorId,
  ]);

  const apiFilters = useMemo(
    () => toApiFilters(storeState.filters),
    [storeState.filters],
  );

  const [debouncedFilters, setDebouncedFilters] = useState(apiFilters);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilters(apiFilters), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [apiFilters]);

  const queryId: IndicatorQueryId = storeState.selectedIndicatorId ?? ANY_INDICATOR_ID;

  const casesParams = useMemo(
    (): IndicatorCasesParams => ({
      ...debouncedFilters,
      page: storeState.currentPage,
      limit: storeState.pageSize,
      sortBy: 'issuedAt',
      sortOrder: 'DESC',
    }),
    [debouncedFilters, storeState.currentPage, storeState.pageSize],
  );

  const summaryQuery = useIndicatorSummaryQuery(debouncedFilters);
  const casesQuery = useIndicatorCasesQuery(queryId, casesParams);

  const pagination = casesQuery.data
    ? {
        page: casesQuery.data.page,
        limit: casesQuery.data.limit,
        total: casesQuery.data.total,
        totalPages: casesQuery.data.totalPages,
        hasNext: casesQuery.data.hasNext,
        hasPrev: casesQuery.data.hasPrev,
      }
    : null;

  const selectedIndicator = useMemo(() => {
    if (!storeState.selectedIndicatorId) return null;
    return (
      summaryQuery.data?.indicators.find(
        (item) => item.id === storeState.selectedIndicatorId,
      ) ?? null
    );
  }, [storeState.selectedIndicatorId, summaryQuery.data?.indicators]);

  const hasActiveFilters = useMemo(
    () => hasFilterValues(storeState.filters),
    [storeState.filters],
  );

  const handleSelectIndicator = useCallback(
    (id: CatalogIndicatorId) => {
      storeActions.setSelectedIndicatorId(
        storeState.selectedIndicatorId === id ? null : id,
      );
    },
    [storeActions, storeState.selectedIndicatorId],
  );

  const handleFilterChange = useCallback(
    (filters: Partial<IndicatorCenterFilters>) => {
      storeActions.setFilters(filters);
    },
    [storeActions],
  );

  const handleClearFilters = useCallback(() => {
    storeActions.clearFilters();
  }, [storeActions]);

  const handlePageChange = useCallback(
    (page: number) => {
      storeActions.setPage(page);
    },
    [storeActions],
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      storeActions.setPageSize(size);
    },
    [storeActions],
  );

  const handleRowClick = useCallback(
    (autefId: number) => {
      navigate(ROUTES.semaspa.autefDetail.replace(':id', String(autefId)));
    },
    [navigate],
  );

  const handlePersonRowClick = useCallback(
    (personId: string) => {
      navigate(personDetailPath(personId));
    },
    [navigate],
  );

  const handlePlateRowClick = useCallback(
    (plate: string) => {
      navigate(`${ROUTES.semaspa.forestGuides}?plate=${encodeURIComponent(plate)}`);
    },
    [navigate],
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await IndicatorsService.exportCasesCsv(queryId, debouncedFilters);
    } catch {
      setExportError('exportFailed');
    } finally {
      setIsExporting(false);
    }
  }, [debouncedFilters, queryId]);

  const handleRefresh = useCallback(() => {
    void summaryQuery.refetch();
    void casesQuery.refetch();
  }, [summaryQuery, casesQuery]);

  return {
    api: {
      summary: summaryQuery.data ?? null,
      rows: casesQuery.data?.data ?? [],
      pagination,
      isSummaryLoading: summaryQuery.isLoading,
      isSummaryFetching: summaryQuery.isFetching,
      isCasesLoading: casesQuery.isLoading,
      isCasesFetching: casesQuery.isFetching,
      isError: summaryQuery.isError || casesQuery.isError,
      error: summaryQuery.error ?? casesQuery.error,
      hasActiveFilters,
      selectedIndicator,
      selectedEntity: selectedIndicator?.entity ?? 'autef',
      queryId,
      isExporting,
      exportError,
      totalPages: pagination?.totalPages ?? 1,
    },
    store: {
      state: storeState,
      actions: storeActions,
    },
    handlers: {
      handleSelectIndicator,
      handleFilterChange,
      handleClearFilters,
      handlePageChange,
      handlePageSizeChange,
      handleRowClick,
      handlePersonRowClick,
      handlePlateRowClick,
      handleExport,
      handleRefresh,
    },
  };
}

export type IndicatorsController = ReturnType<typeof useIndicatorsController>;
