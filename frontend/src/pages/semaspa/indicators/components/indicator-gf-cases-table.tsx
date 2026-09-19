import { useTranslation } from 'react-i18next';

import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import { isGfIndicatorCase } from '@/types/semaspa';
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
import type { IndicatorsController } from '../hooks/use-indicators-controller';
import { PermitMatchStatusBadge } from '../../permit-references/components/permit-match-status-badge';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const COL_COUNT = 5;

interface IndicatorGfCasesTableProps {
  controller: IndicatorsController;
}

export function IndicatorGfCasesTable({ controller }: IndicatorGfCasesTableProps) {
  const { t } = useTranslation();
  const {
    api: { rows, isCasesLoading, pagination, hasActiveFilters, totalPages },
    store: { state },
    handlers: { handlePageChange, handlePageSizeChange, handleClearFilters, handleGfRowClick },
  } = controller;
  const guides = rows.filter(isGfIndicatorCase);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.indicators.table.forestGuide')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.type')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.issuedAt')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.matchStatuses')}</TableHead>
                <TableHead>{t('semaspa.indicators.table.rawReferences')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isCasesLoading && guides.length === 0
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: COL_COUNT }).map((__, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!isCasesLoading && guides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                    {hasActiveFilters
                      ? t('semaspa.indicators.list.noResultsWithFilters')
                      : t('semaspa.indicators.list.noForestGuides')}
                    {hasActiveFilters ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="ml-2"
                        onClick={handleClearFilters}
                      >
                        {t('semaspa.indicators.filters.clear')}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ) : null}
              {guides.map((row) => (
                <TableRow
                  key={row.forestGuideId}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleGfRowClick(row.forestGuideId)}
                >
                  <TableCell className="font-mono text-[13px] font-medium">
                    {row.number ?? `#${row.forestGuideId}`}
                  </TableCell>
                  <TableCell>{row.type ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(row.matchStatuses ?? []).map((status) => (
                        <PermitMatchStatusBadge key={status} status={status} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[13px]">
                    {(row.rawReferences ?? []).join(', ') || '—'}
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
        currentPage={pagination?.page || state.currentPage}
        totalPages={Math.max(1, totalPages)}
        canPrev={Boolean(pagination?.hasPrev)}
        canNext={Boolean(pagination?.hasNext)}
        onPageChange={handlePageChange}
        isBusy={isCasesLoading}
      />
    </div>
  );
}
