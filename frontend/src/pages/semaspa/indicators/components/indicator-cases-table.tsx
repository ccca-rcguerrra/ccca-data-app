import { useTranslation } from 'react-i18next';

import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import { INDICATOR_IDS, isAutefIndicatorCase } from '@/types/semaspa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';

import type { IndicatorsController } from '../hooks/use-indicators-controller';
import { formatRatio } from '../../autefs/utils/format';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const COL_COUNT = 7;

function formatExcess(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface IndicatorCasesTableProps {
  controller: IndicatorsController;
}

export function IndicatorCasesTable({ controller }: IndicatorCasesTableProps) {
  const { t } = useTranslation();
  const {
    api: {
      rows,
      pagination,
      isCasesLoading,
      totalPages,
      hasActiveFilters,
    },
    store: { state },
    handlers: { handlePageChange, handlePageSizeChange, handleRowClick, handleClearFilters },
  } = controller;

  const currentPage = pagination?.page ?? state.currentPage;
  const hasPrev = pagination?.hasPrev ?? currentPage > 1;
  const hasNext = pagination?.hasNext ?? currentPage < totalPages;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.indicators.table.number')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.indicators')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.city')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.state')}</TableHead>
                <TableHead className="text-right">{t('semaspa.indicators.table.maxRatio')}</TableHead>
                <TableHead className="text-right">{t('semaspa.indicators.table.excess')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.issuedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCasesLoading && rows.length === 0
                ? Array.from({ length: 10 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: COL_COUNT }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!isCasesLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? t('semaspa.indicators.list.noResultsWithFilters')
                          : t('semaspa.indicators.list.noResults')}
                      </p>
                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          {t('semaspa.indicators.filters.clear')}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}

              {rows.filter(isAutefIndicatorCase).map((row) => (
                <TableRow
                  key={row.autefId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.autefId)}
                >
                  <TableCell className="font-mono text-[13px] font-medium">
                    {row.number ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {row.matchedIndicatorIds.includes(INDICATOR_IDS.OVER_EXTRACTED) ? (
                        <Badge variant="destructive">
                          {t('semaspa.autefs.volumeBalances.overExtracted')}
                        </Badge>
                      ) : null}
                      {row.matchedIndicatorIds.includes(INDICATOR_IDS.CREDIT_USE_OVER_90) ? (
                        <Badge variant="outline">
                          {t('semaspa.indicators.badges.creditUse')}
                        </Badge>
                      ) : null}
                      {row.matchedIndicatorIds.includes(INDICATOR_IDS.UNIT_CONFLICT) ||
                      row.hasUnitConflict ? (
                        <Badge variant="secondary">
                          {t('semaspa.autefs.volumeBalances.unitConflict')}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{row.city ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">{row.state ?? '—'}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatRatio(row.maxMovedRatio)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatExcess(row.maxExcessVolume)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ListPaginationFooter
        leftContent={
          pagination
            ? t('semaspa.indicators.list.totalRows', { count: pagination.total })
            : undefined
        }
        pageSize={state.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        totalPages={Math.max(1, totalPages)}
        canPrev={hasPrev}
        canNext={hasNext}
        onPageChange={handlePageChange}
        isBusy={isCasesLoading}
      />
    </div>
  );
}
