import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/shadcn/badge';
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
import type { AutefsListController } from '../hooks/use-autefs-list-controller';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface AutefsTableProps {
  controller: AutefsListController;
}

function formatArea(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Paginated AUTEFs table with sticky header and footer.
 */
export function AutefsTable({ controller }: AutefsTableProps) {
  const { t } = useTranslation();
  const {
    api: { rows, pagination, isLoading, totalPages, showOverExtractedBadge },
    store: { state },
    handlers: { handlePageChange, handlePageSizeChange, handleRowClick },
  } = controller;

  const currentPage = pagination?.page ?? state.currentPage;
  const hasPrev = pagination?.hasPrev ?? currentPage > 1;
  const hasNext = pagination?.hasNext ?? currentPage < totalPages;
  const colCount = showOverExtractedBadge ? 8 : 7;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border m-4 border-[var(--color-neutral-300)]">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.autefs.table.number')}</TableHead>
                <TableHead>{t('semaspa.autefs.table.processNumber')}</TableHead>
                <TableHead>{t('semaspa.autefs.table.city')}</TableHead>
                <TableHead>{t('semaspa.autefs.table.state')}</TableHead>
                <TableHead>{t('semaspa.autefs.table.issueYear')}</TableHead>
                <TableHead className="text-right">{t('semaspa.autefs.table.totalAreaHa')}</TableHead>
                <TableHead>{t('semaspa.autefs.table.issuedAt')}</TableHead>
                {showOverExtractedBadge ? (
                  <TableHead>{t('semaspa.autefs.table.flags')}</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0
                ? Array.from({ length: 10 }).map((_, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Array.from({ length: colCount }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!isLoading && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.autefs.list.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}

              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => handleRowClick(row.id)}
                >
                  <TableCell className="font-medium">{row.number ?? '—'}</TableCell>
                  <TableCell>{row.processNumber ?? '—'}</TableCell>
                  <TableCell>{row.city ?? '—'}</TableCell>
                  <TableCell>{row.state ?? '—'}</TableCell>
                  <TableCell>{row.issueYear ?? '—'}</TableCell>
                  <TableCell className="text-right">{formatArea(row.totalAreaHa)}</TableCell>
                  <TableCell>
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                  {showOverExtractedBadge ? (
                    <TableCell>
                      <Badge variant="destructive">
                        {t('semaspa.autefs.volumeBalances.overExtracted')}
                      </Badge>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <ListPaginationFooter
        leftContent={
          pagination
            ? t('semaspa.autefs.list.totalRows', { count: pagination.total })
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
        isBusy={isLoading}
      />
    </div>
  );
}
