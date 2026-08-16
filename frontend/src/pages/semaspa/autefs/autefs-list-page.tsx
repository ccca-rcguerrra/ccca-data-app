import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import { Button } from '@/components/ui/shadcn/button';

import {
  useAutefsListController,
  type AutefsListController,
} from './hooks/use-autefs-list-controller';
import { AutefsTable } from './components/autefs-table';

const SEARCH_DEBOUNCE_MS = 350;

function AutefsListPageHeader({ controller }: { controller: AutefsListController }) {
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
      handleOverExtractedToggle,
    },
  } = controller;

  const [searchValue, setSearchValue] = useState(state.quickFilters.searchQuery);
  const [cityValue, setCityValue] = useState(state.quickFilters.city);
  const [stateValue, setStateValue] = useState(state.quickFilters.state);
  const [yearValue, setYearValue] = useState(state.quickFilters.issueYear);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ searchQuery: searchValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchValue, handleQuickFilterChange]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ city: cityValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [cityValue, handleQuickFilterChange]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ state: stateValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [stateValue, handleQuickFilterChange]);

  useEffect(() => {
    const timer = setTimeout(
      () => handleQuickFilterChange({ issueYear: yearValue }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [yearValue, handleQuickFilterChange]);

  useEffect(() => setSearchValue(state.quickFilters.searchQuery), [state.quickFilters.searchQuery]);
  useEffect(() => setCityValue(state.quickFilters.city), [state.quickFilters.city]);
  useEffect(() => setStateValue(state.quickFilters.state), [state.quickFilters.state]);
  useEffect(() => setYearValue(state.quickFilters.issueYear), [state.quickFilters.issueYear]);

  const busy = isLoading || isFetching;
  const inputs = state.advancedInputs;
  const hasForestGuideValue =
    inputs.hasForestGuide === null
      ? 'any'
      : inputs.hasForestGuide
        ? 'yes'
        : 'no';

  return (
    <div className="p-6 pb-4 shrink-0 border-b border-border space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('semaspa.autefs.list.title')}
            </h2>
            {pagination && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t('semaspa.autefs.list.total', { count: pagination.total })}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed mt-0.5">
            {t('semaspa.autefs.list.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-card p-1.5">
            <div className="relative w-[200px] min-w-[160px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('semaspa.autefs.filters.searchPlaceholder')}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="h-9 border-border bg-background pl-10 shadow-none"
                disabled={busy}
              />
            </div>

            <Input
              placeholder={t('semaspa.autefs.filters.cityPlaceholder')}
              value={cityValue}
              onChange={(e) => setCityValue(e.target.value)}
              className="h-9 w-[140px] border-border bg-background shadow-none"
              disabled={busy}
            />

            <Input
              placeholder={t('semaspa.autefs.filters.statePlaceholder')}
              value={stateValue}
              onChange={(e) => setStateValue(e.target.value)}
              className="h-9 w-[80px] border-border bg-background shadow-none"
              disabled={busy}
            />

            <Input
              placeholder={t('semaspa.autefs.filters.yearPlaceholder')}
              value={yearValue}
              onChange={(e) => setYearValue(e.target.value)}
              className="h-9 w-[90px] border-border bg-background shadow-none"
              inputMode="numeric"
              disabled={busy}
            />
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleOverExtractedToggle(!state.advancedApplied.isOverExtracted)}
            className={cn(
              'h-9 rounded-full border px-3 text-xs font-medium transition-colors',
              state.advancedApplied.isOverExtracted
                ? 'border-brand-yellow bg-brand-yellow text-brand-yellow-foreground'
                : 'border-border bg-transparent text-foreground hover:bg-muted',
            )}
          >
            {t('semaspa.autefs.filters.isOverExtracted')}
          </button>

          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleToggleAdvanced}
            disabled={busy}
          >
            <Filter className="h-4 w-4" />
            {t('semaspa.autefs.filters.advanced')}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${state.advancedOpen ? 'rotate-180' : ''}`}
            />
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
              {t('semaspa.autefs.filters.clear')}
            </Button>
          )}

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
              <Label htmlFor="autef-month">{t('semaspa.autefs.filters.issueMonth')}</Label>
              <Select
                value={inputs.issueMonth || 'all'}
                onValueChange={(value) =>
                  handleAdvancedInputChange({ issueMonth: value === 'all' ? '' : value })
                }
              >
                <SelectTrigger id="autef-month" className="h-9">
                  <SelectValue placeholder={t('semaspa.autefs.filters.any')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('semaspa.autefs.filters.any')}</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(2000, i, 1).toLocaleString(undefined, { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-process">{t('semaspa.autefs.filters.processNumber')}</Label>
              <Input
                id="autef-process"
                value={inputs.processNumber}
                onChange={(e) => handleAdvancedInputChange({ processNumber: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-from">{t('semaspa.autefs.filters.issuedFrom')}</Label>
              <Input
                id="autef-from"
                type="date"
                value={inputs.issuedFrom}
                onChange={(e) => handleAdvancedInputChange({ issuedFrom: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-to">{t('semaspa.autefs.filters.issuedTo')}</Label>
              <Input
                id="autef-to"
                type="date"
                value={inputs.issuedTo}
                onChange={(e) => handleAdvancedInputChange({ issuedTo: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-tax">{t('semaspa.autefs.filters.taxId')}</Label>
              <Input
                id="autef-tax"
                value={inputs.taxId}
                onChange={(e) => handleAdvancedInputChange({ taxId: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-person">{t('semaspa.autefs.filters.personName')}</Label>
              <Input
                id="autef-person"
                value={inputs.personName}
                onChange={(e) => handleAdvancedInputChange({ personName: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-ratio-min">{t('semaspa.autefs.filters.movedRatioMin')}</Label>
              <Input
                id="autef-ratio-min"
                value={inputs.movedRatioMin}
                onChange={(e) => handleAdvancedInputChange({ movedRatioMin: e.target.value })}
                className="h-9"
                inputMode="decimal"
                placeholder="0"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-ratio-max">{t('semaspa.autefs.filters.movedRatioMax')}</Label>
              <Input
                id="autef-ratio-max"
                value={inputs.movedRatioMax}
                onChange={(e) => handleAdvancedInputChange({ movedRatioMax: e.target.value })}
                className="h-9"
                inputMode="decimal"
                placeholder="1"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-species-id">{t('semaspa.autefs.filters.speciesProductId')}</Label>
              <Input
                id="autef-species-id"
                value={inputs.speciesProductId}
                onChange={(e) => handleAdvancedInputChange({ speciesProductId: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-sci">{t('semaspa.autefs.filters.scientificName')}</Label>
              <Input
                id="autef-sci"
                value={inputs.scientificName}
                onChange={(e) => handleAdvancedInputChange({ scientificName: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autef-common">{t('semaspa.autefs.filters.commonName')}</Label>
              <Input
                id="autef-common"
                value={inputs.commonName}
                onChange={(e) => handleAdvancedInputChange({ commonName: e.target.value })}
                className="h-9"
                disabled={busy}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('semaspa.autefs.filters.hasForestGuide')}</Label>
              <Select
                value={hasForestGuideValue}
                onValueChange={(value) =>
                  handleAdvancedInputChange({
                    hasForestGuide: value === 'any' ? null : value === 'yes',
                  })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">{t('semaspa.autefs.filters.any')}</SelectItem>
                  <SelectItem value="yes">{t('semaspa.autefs.filters.yes')}</SelectItem>
                  <SelectItem value="no">{t('semaspa.autefs.filters.no')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9">
                  {t('common.cancel')}
                </Button>
              </CollapsibleTrigger>
              <Button size="sm" className="h-9" onClick={handleApplyAdvancedFilters} disabled={busy}>
                {t('semaspa.autefs.filters.apply')}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function AutefsListPage() {
  const { t } = useTranslation();
  const controller = useAutefsListController();

  if (controller.api.isError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over shrink-0" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.autefs.errors.title')}
          </h2>
          <p className="text-sm text-center text-foreground">
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('semaspa.autefs.errors.message')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <AutefsListPageHeader controller={controller} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <AutefsTable controller={controller} />
      </div>
    </div>
  );
}
