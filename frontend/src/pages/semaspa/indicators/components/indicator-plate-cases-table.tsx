import { useTranslation } from 'react-i18next';

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
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import { isPlateIndicatorCase } from '@/types/semaspa';

import type { IndicatorsController } from '../hooks/use-indicators-controller';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const COL_COUNT = 3;

interface IndicatorPlateCasesTableProps {
  controller: IndicatorsController;
}

export function IndicatorPlateCasesTable({ controller }: IndicatorPlateCasesTableProps) {
  const { t } = useTranslation();
  const {
    api: { rows, pagination, isCasesLoading, totalPages, hasActiveFilters },
    store: { state },
    handlers: {
      handlePageChange,
      handlePageSizeChange,
      handlePlateRowClick,
      handleClearFilters,
    },
  } = controller;

  const currentPage = pagination?.page ?? state.currentPage;
  const plates = rows.filter(isPlateIndicatorCase);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.indicators.table.plate')}</TableHead>
                <TableHead className="text-right">
                  {t('semaspa.indicators.table.distinctGfs')}
                </TableHead>
                <TableHead className="text-right">
                  {t('semaspa.indicators.table.distinctAutefs')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCasesLoading && plates.length === 0
                ? Array.from({ length: 8 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: COL_COUNT }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!isCasesLoading && plates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? t('semaspa.indicators.list.noResultsWithFilters')
                          : t('semaspa.indicators.list.noPlates')}
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
              {plates.map((row) => (
                <TableRow
                  key={row.plate}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handlePlateRowClick(row.plate)}
                >
                  <TableCell className="font-mono text-[13px] font-medium uppercase">
                    {row.plate}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.distinctGfCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.distinctAutefCount}
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
        canPrev={pagination?.hasPrev ?? currentPage > 1}
        canNext={pagination?.hasNext ?? currentPage < totalPages}
        onPageChange={handlePageChange}
        isBusy={isCasesLoading}
      />
    </div>
  );
}
