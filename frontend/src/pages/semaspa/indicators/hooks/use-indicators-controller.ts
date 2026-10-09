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


import {
  useIndicatorsActions,
  useIndicatorsState,
} from '../store/use-indicators-store';
import { parseIndicatorSearchParams } from '../lib/indicator-url-state';
import { personDetailPath } from '../../people/components/person-link';

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
    const merged = new URLSearchParams(searchParams);
    if (storeState.selectedIndicatorId) {
      merged.set('indicator', storeState.selectedIndicatorId);
    } else {
      merged.delete('indicator');
    }
    if (merged.toString() !== searchParams.toString()) {
      setSearchParams(merged, { replace: true });
    }
  }, [searchParams, setSearchParams, storeState.selectedIndicatorId]);

  const queryId: IndicatorQueryId = storeState.selectedIndicatorId ?? ANY_INDICATOR_ID;

  const casesParams = useMemo(
    (): IndicatorCasesParams => ({
      page: storeState.currentPage,
      limit: storeState.pageSize,
      sortBy: 'issuedAt',
      sortOrder: 'DESC',
    }),
    [storeState.currentPage, storeState.pageSize],
  );

  const summaryQuery = useIndicatorSummaryQuery();
  const casesQuery = useIndicatorCasesQuery(queryId, casesParams, {
    enabled: storeState.isCasesDialogOpen,
  });

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

  const handleSelectIndicator = useCallback(
    (id: CatalogIndicatorId) => {
      storeActions.setSelectedIndicatorId(id);
      storeActions.setCasesDialogOpen(true);
    },
    [storeActions],
  );

  const handleCloseCasesDialog = useCallback(() => {
    storeActions.setCasesDialogOpen(false);
  }, [storeActions]);

  const handleOpenCasesDialog = useCallback(() => {
    storeActions.setCasesDialogOpen(true);
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

  const handleGfRowClick = useCallback(
    (forestGuideId: number) => {
      navigate(ROUTES.semaspa.forestGuideDetail.replace(':id', String(forestGuideId)));
    },
    [navigate],
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await IndicatorsService.exportCasesCsv(queryId, {});
      return true;
    } catch {
      setExportError('exportFailed');
      return false;
    } finally {
      setIsExporting(false);
    }
  }, [queryId]);

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
      handleCloseCasesDialog,
      handleOpenCasesDialog,
      handlePageChange,
      handlePageSizeChange,
      handleRowClick,
      handlePersonRowClick,
      handlePlateRowClick,
      handleGfRowClick,
      handleExport,
      handleRefresh,
    },
  };
}

export type IndicatorsController = ReturnType<typeof useIndicatorsController>;
