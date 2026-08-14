import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';

import type { ForestGuidesListController } from '../hooks/use-forest-guides-list-controller';
import { ForestGuideStatusBadge } from './forest-guide-status-badge';
import { PlateChip } from './plate-chip';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Props {
  controller: ForestGuidesListController;
}

export function ForestGuidesTable({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: { rows, pagination, isLoading, totalPages, hasActiveFilters },
    store: { state },
    handlers: { handlePageChange, handlePageSizeChange, handleRowClick, handleClearFilters },
  } = controller;

  const currentPage = pagination?.page ?? state.currentPage;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.forestGuides.table.number')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.table.status')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.table.type')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.table.issuedAt')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.table.plates')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0
                ? Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32">
                    <div className="flex flex-col items-center justify-center gap-2 text-center">
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters
                          ? t('semaspa.forestGuides.list.noResultsWithFilters')
                          : t('semaspa.forestGuides.list.noResults')}
                      </p>
                      {hasActiveFilters ? (
                        <Button variant="outline" size="sm" onClick={handleClearFilters}>
                          {t('semaspa.forestGuides.filters.clear')}
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(row.id)}
                >
                  <TableCell className="font-mono text-[13px] font-medium">
                    {row.number ?? '—'}
                  </TableCell>
                  <TableCell>
                    <ForestGuideStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>{row.type ?? '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                  <TableCell>
                    <PlateChip plates={row.vehiclePlates} />
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
            ? t('semaspa.forestGuides.list.totalRows', { count: pagination.total })
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
        isBusy={isLoading}
      />
    </div>
  );
}
