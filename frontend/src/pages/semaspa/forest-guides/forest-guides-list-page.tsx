import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ChevronDown, Filter, RefreshCw, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/shadcn/collapsible';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { ForestGuidesTable } from './components/forest-guides-table';
import {
  useForestGuidesListController,
  type ForestGuidesListController,
} from './hooks/use-forest-guides-list-controller';

const SEARCH_DEBOUNCE_MS = 350;

function ForestGuidesListHeader({ controller }: { controller: ForestGuidesListController }) {
  const { t } = useTranslation();
  const {
    api: { pagination, isLoading, isFetching, refetch, hasActiveFilters },
    store: { state },
    handlers: {
      handleQuickFilterChange,
      handleAdvancedInputChange,
      handleApplyAdvancedFilters,
      handleToggleAdvanced,
      handleClearFilters,
    },
  } = controller;

  const [searchValue, setSearchValue] = useState(state.quickFilters.searchQuery);
  const [statusValue, setStatusValue] = useState(state.quickFilters.status);
  const [typeValue, setTypeValue] = useState(state.quickFilters.type);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ searchQuery: searchValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchValue, handleQuickFilterChange]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ status: statusValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [statusValue, handleQuickFilterChange]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ type: typeValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [typeValue, handleQuickFilterChange]);

  useEffect(() => setSearchValue(state.quickFilters.searchQuery), [state.quickFilters.searchQuery]);
  useEffect(() => setStatusValue(state.quickFilters.status), [state.quickFilters.status]);
  useEffect(() => setTypeValue(state.quickFilters.type), [state.quickFilters.type]);

  const busy = isLoading || isFetching;
  const inputs = state.advancedInputs;

  return (
    <div className="p-6 pb-4 shrink-0 border-b border-border space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              {t('semaspa.forestGuides.list.title')}
            </h2>
            {pagination ? (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t('semaspa.forestGuides.list.total', { count: pagination.total })}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {t('semaspa.forestGuides.list.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1.5">
            <div className="relative w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 border-border bg-background pl-10 shadow-none"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('semaspa.forestGuides.filters.searchPlaceholder')}
                disabled={busy}
              />
            </div>
            <Input
              className="h-9 w-[120px] border-border bg-background shadow-none"
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              placeholder={t('semaspa.forestGuides.filters.statusPlaceholder')}
              disabled={busy}
            />
            <Input
              className="h-9 w-[120px] border-border bg-background shadow-none"
              value={typeValue}
              onChange={(e) => setTypeValue(e.target.value)}
              placeholder={t('semaspa.forestGuides.filters.typePlaceholder')}
              disabled={busy}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9" onClick={handleToggleAdvanced}>
            <Filter className="h-4 w-4" />
            {t('semaspa.forestGuides.filters.advanced')}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${state.advancedOpen ? 'rotate-180' : ''}`}
            />
          </Button>
          {hasActiveFilters ? (
            <Button variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
              {t('semaspa.forestGuides.filters.clear')}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            disabled={busy}
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Collapsible open={state.advancedOpen} onOpenChange={handleToggleAdvanced}>
        <CollapsibleContent className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.issuedFrom')}</Label>
              <Input
                type="date"
                className="h-9"
                value={inputs.issuedFrom}
                onChange={(e) => handleAdvancedInputChange({ issuedFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.issuedTo')}</Label>
              <Input
                type="date"
                className="h-9"
                value={inputs.issuedTo}
                onChange={(e) => handleAdvancedInputChange({ issuedTo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.autefIdPlaceholder')}</Label>
              <Input
                className="h-9"
                value={inputs.autefId}
                onChange={(e) => handleAdvancedInputChange({ autefId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.taxId')}</Label>
              <Input
                className="h-9"
                value={inputs.taxId}
                onChange={(e) => handleAdvancedInputChange({ taxId: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.personName')}</Label>
              <Input
                className="h-9"
                value={inputs.personName}
                onChange={(e) => handleAdvancedInputChange({ personName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.forestGuides.filters.plate')}</Label>
              <Input
                className="h-9"
                value={inputs.plate}
                onChange={(e) => handleAdvancedInputChange({ plate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.autefs.filters.scientificName')}</Label>
              <Input
                className="h-9"
                value={inputs.scientificName}
                onChange={(e) => handleAdvancedInputChange({ scientificName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t('semaspa.autefs.filters.commonName')}</Label>
              <Input
                className="h-9"
                value={inputs.commonName}
                onChange={(e) => handleAdvancedInputChange({ commonName: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" className="h-9" onClick={handleApplyAdvancedFilters} disabled={busy}>
              {t('semaspa.forestGuides.filters.apply')}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function ForestGuidesListPage() {
  const { t } = useTranslation();
  const controller = useForestGuidesListController();

  if (controller.api.isError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.forestGuides.errors.title')}
          </h2>
          <p className="text-sm text-center">
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('semaspa.forestGuides.errors.message')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <ForestGuidesListHeader controller={controller} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ForestGuidesTable controller={controller} />
      </div>
    </div>
  );
}
