import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Filter, X } from 'lucide-react';

import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';

import type { IndicatorsController } from '../hooks/use-indicators-controller';
import { IndicatorSavedFilters } from './indicator-saved-filters';

interface IndicatorFiltersProps {
  controller: IndicatorsController;
}

export function IndicatorFilters({ controller }: IndicatorFiltersProps) {
  const { t } = useTranslation();
  const {
    api: { isSummaryFetching, isCasesFetching, hasActiveFilters },
    store: { state },
    handlers: { handleFilterChange, handleClearFilters },
  } = controller;

  const busy = isSummaryFetching || isCasesFetching;
  const filters = state.filters;
  const [open, setOpen] = useState(hasActiveFilters);

  useEffect(() => {
    if (hasActiveFilters) setOpen(true);
  }, [hasActiveFilters]);

  return (
    <div className="space-y-3">
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="space-y-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2">
            <Filter className="h-4 w-4" />
            {t('semaspa.indicators.filters.title')}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </Button>
        </CollapsibleTrigger>
        {hasActiveFilters ? (
          <Button variant="outline" size="sm" className="h-8" onClick={handleClearFilters}>
            <X className="h-4 w-4" />
            {t('semaspa.indicators.filters.clear')}
          </Button>
        ) : null}
      </div>

      <CollapsibleContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="indicator-from">{t('semaspa.indicators.filters.issuedFrom')}</Label>
          <Input
            id="indicator-from"
            type="date"
            value={filters.issuedFrom}
            onChange={(e) => handleFilterChange({ issuedFrom: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-to">{t('semaspa.indicators.filters.issuedTo')}</Label>
          <Input
            id="indicator-to"
            type="date"
            value={filters.issuedTo}
            onChange={(e) => handleFilterChange({ issuedTo: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-city">{t('semaspa.indicators.filters.city')}</Label>
          <Input
            id="indicator-city"
            value={filters.city}
            onChange={(e) => handleFilterChange({ city: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-state">{t('semaspa.indicators.filters.state')}</Label>
          <Input
            id="indicator-state"
            value={filters.state}
            onChange={(e) => handleFilterChange({ state: e.target.value })}
            className="h-9 w-full"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-sci">{t('semaspa.indicators.filters.scientificName')}</Label>
          <Input
            id="indicator-sci"
            value={filters.scientificName}
            onChange={(e) => handleFilterChange({ scientificName: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-common">{t('semaspa.indicators.filters.commonName')}</Label>
          <Input
            id="indicator-common"
            value={filters.commonName}
            onChange={(e) => handleFilterChange({ commonName: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-species">{t('semaspa.indicators.filters.speciesProductId')}</Label>
          <Input
            id="indicator-species"
            value={filters.speciesProductId}
            onChange={(e) => handleFilterChange({ speciesProductId: e.target.value })}
            className="h-9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-ratio-min">{t('semaspa.indicators.filters.movedRatioMin')}</Label>
          <Input
            id="indicator-ratio-min"
            value={filters.movedRatioMin}
            onChange={(e) => handleFilterChange({ movedRatioMin: e.target.value })}
            className="h-9"
            inputMode="decimal"
            placeholder="0.9"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-ratio-max">{t('semaspa.indicators.filters.movedRatioMax')}</Label>
          <Input
            id="indicator-ratio-max"
            value={filters.movedRatioMax}
            onChange={(e) => handleFilterChange({ movedRatioMax: e.target.value })}
            className="h-9"
            inputMode="decimal"
            placeholder="1.5"
            disabled={busy}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="indicator-excess">{t('semaspa.indicators.filters.excessVolumeMin')}</Label>
          <Input
            id="indicator-excess"
            value={filters.excessVolumeMin}
            onChange={(e) => handleFilterChange({ excessVolumeMin: e.target.value })}
            className="h-9"
            inputMode="decimal"
            disabled={busy}
          />
        </div>
      </div>
      </CollapsibleContent>
    </Collapsible>
    <p className="text-xs text-muted-foreground">
      {t('semaspa.indicators.filters.savedHint')}
    </p>
    <IndicatorSavedFilters controller={controller} />
    </div>
  );
}
