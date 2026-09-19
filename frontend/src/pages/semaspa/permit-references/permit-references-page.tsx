import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, RefreshCw, Search } from 'lucide-react';

import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Label } from '@/components/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import type { PermitReferenceMatchStatus } from '@/types/semaspa';
import { usePermitReferencesListController } from './hooks/use-permit-references-list-controller';
import { PermitReferencesList } from './components/permit-references-list';

const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE_OPTIONS = [20, 50, 100];
const MATCH_STATUSES: PermitReferenceMatchStatus[] = [
  'unparseable',
  'unmatched',
  'matched',
  'ambiguous',
];

export function PermitReferencesPage() {
  const { t } = useTranslation();
  const { api, store } = usePermitReferencesListController();
  const [searchValue, setSearchValue] = useState(store.state.searchQuery);

  useEffect(() => {
    const timer = setTimeout(
      () => store.actions.setSearchQuery(searchValue),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchValue, store.actions]);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-4 shrink-0 border-b border-border space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">
              {t('semaspa.permitReferences.list.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('semaspa.permitReferences.list.subtitle')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('semaspa.permitReferences.list.total', { count: api.rows.total })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void api.refetch()}>
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t('semaspa.permitReferences.list.searchPlaceholder')}
            />
          </div>
          <Select
            value={store.state.matchStatus || 'all'}
            onValueChange={(value) =>
              store.actions.setMatchStatus(
                value === 'all' ? '' : (value as PermitReferenceMatchStatus),
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t('semaspa.permitReferences.filters.status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('semaspa.permitReferences.filters.anyStatus')}</SelectItem>
              {MATCH_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`semaspa.permitReferences.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={store.state.type}
            onChange={(event) => store.actions.setType(event.target.value)}
            placeholder={t('semaspa.permitReferences.filters.type')}
          />
          <div>
            <Label className="sr-only">{t('semaspa.permitReferences.filters.issuedFrom')}</Label>
            <Input
              type="date"
              value={store.state.issuedFrom}
              onChange={(event) => store.actions.setIssuedFrom(event.target.value)}
            />
          </div>
          <div>
            <Label className="sr-only">{t('semaspa.permitReferences.filters.issuedTo')}</Label>
            <Input
              type="date"
              value={store.state.issuedTo}
              onChange={(event) => store.actions.setIssuedTo(event.target.value)}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={store.state.multiple}
            onChange={(event) => store.actions.setMultiple(event.target.checked)}
          />
          {t('semaspa.permitReferences.filters.multiple')}
        </label>
      </div>

      {api.isError ? (
        <div className="p-6">
          <div className="flex items-center gap-2 text-status-over" role="alert">
            <AlertCircle className="h-4 w-4" />
            {t('semaspa.permitReferences.errors.listTitle')}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <PermitReferencesList
              rows={api.rows.data}
              emptyLabel={t('semaspa.permitReferences.list.empty')}
              showForestGuide
            />
          </div>
          <ListPaginationFooter
            leftContent={t('semaspa.permitReferences.list.totalRows', {
              count: api.rows.total,
            })}
            pageSize={store.state.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            onPageSizeChange={store.actions.setPageSize}
            currentPage={api.rows.page || store.state.currentPage}
            totalPages={Math.max(1, api.rows.totalPages)}
            canPrev={api.rows.hasPrev}
            canNext={api.rows.hasNext}
            onPageChange={store.actions.setPage}
            isBusy={api.isLoading}
          />
        </div>
      )}
    </div>
  );
}
