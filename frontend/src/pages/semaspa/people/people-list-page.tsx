import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

import { Input } from '@/components/ui/shadcn/input';
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
import { formatPersonLabel } from '../autefs/utils/format';

import { usePeopleListController } from './hooks/use-people-list-controller';

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const COL_COUNT = 6;

export function PeopleListPage() {
  const { t } = useTranslation();
  const { api, store, handlers } = usePeopleListController();
  const [searchValue, setSearchValue] = useState(store.state.searchQuery);

  useEffect(() => {
    const timer = setTimeout(
      () => handlers.handleSearchChange(searchValue),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchValue, handlers.handleSearchChange]);

  const rows = api.people.data;
  const totalPages = Math.max(1, api.people.totalPages);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-4 shrink-0 border-b border-border space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">{t('semaspa.people.list.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('semaspa.people.list.subtitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('semaspa.people.list.total', { count: api.people.total })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void api.refetch()}>
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t('semaspa.people.list.searchPlaceholder')}
          />
        </div>
      </div>

      {api.isError ? (
        <div className="p-6">
          <div className="flex items-center gap-2 text-status-over" role="alert">
            <AlertCircle className="h-4 w-4" />
            {t('semaspa.people.errors.listTitle')}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <div className="overflow-hidden rounded-lg border border-border m-4">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>{t('semaspa.people.table.name')}</TableHead>
                    <TableHead>{t('semaspa.people.table.taxId')}</TableHead>
                    <TableHead>{t('semaspa.people.table.city')}</TableHead>
                    <TableHead>{t('semaspa.people.table.state')}</TableHead>
                    <TableHead>{t('semaspa.people.table.sources')}</TableHead>
                    <TableHead className="text-right">
                      {t('semaspa.people.table.occurrences')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {api.isLoading && rows.length === 0
                    ? Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={index}>
                          {Array.from({ length: COL_COUNT }).map((__, cell) => (
                            <TableCell key={cell}>
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    : null}
                  {!api.isLoading && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                        {t('semaspa.people.list.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handlers.handleOpenPerson(row.id)}
                    >
                      <TableCell className="font-medium">
                        {formatPersonLabel(row, row.id)}
                      </TableCell>
                      <TableCell className="font-mono text-[13px]">{row.taxId ?? '—'}</TableCell>
                      <TableCell>{row.city ?? '—'}</TableCell>
                      <TableCell>{row.state ?? '—'}</TableCell>
                      <TableCell>{row.sources?.filter(Boolean).join(', ') || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.occurrenceCount ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <ListPaginationFooter
            leftContent={t('semaspa.people.list.totalRows', { count: api.people.total })}
            pageSize={store.state.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={handlers.handlePageSizeChange}
            currentPage={api.people.page || store.state.currentPage}
            totalPages={totalPages}
            canPrev={api.people.hasPrev}
            canNext={api.people.hasNext}
            onPageChange={handlers.handlePageChange}
            isBusy={api.isLoading}
          />
        </div>
      )}
    </div>
  );
}
