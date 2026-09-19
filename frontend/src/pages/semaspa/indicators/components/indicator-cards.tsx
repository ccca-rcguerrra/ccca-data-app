import { useTranslation } from 'react-i18next';

import { INDICATOR_IDS, type CatalogIndicatorId } from '@/types/semaspa';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/shadcn/skeleton';

import type { IndicatorsController } from '../hooks/use-indicators-controller';

const VOLUME_CARD_ORDER: CatalogIndicatorId[] = [
  INDICATOR_IDS.OVER_EXTRACTED,
  INDICATOR_IDS.CREDIT_USE_OVER_90,
  INDICATOR_IDS.UNIT_CONFLICT,
];

const ACTOR_CARD_ORDER: CatalogIndicatorId[] = [
  INDICATOR_IDS.PERSON_MULTIPLE_OVER_EXTRACTED_AUTEFS,
  INDICATOR_IDS.PERSON_RECURRENT_GF_DESTINATION,
  INDICATOR_IDS.PLATE_RECURRENT,
];

const GF_CARD_ORDER: CatalogIndicatorId[] = [
  INDICATOR_IDS.GF_PERMIT_UNPARSEABLE,
  INDICATOR_IDS.GF_PERMIT_UNMATCHED,
];

interface IndicatorCardsProps {
  controller: IndicatorsController;
}

export function IndicatorCards({ controller }: IndicatorCardsProps) {
  const { t } = useTranslation();
  const {
    api: { summary, isSummaryLoading, selectedIndicator },
    store: { state },
    handlers: { handleSelectIndicator },
  } = controller;

  if (isSummaryLoading && !summary) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VOLUME_CARD_ORDER.map((id) => (
            <Skeleton key={id} className="h-[108px] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACTOR_CARD_ORDER.map((id) => (
            <Skeleton key={id} className="h-[108px] rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GF_CARD_ORDER.map((id) => (
            <Skeleton key={id} className="h-[108px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const byId = new Map((summary?.indicators ?? []).map((item) => [item.id, item]));

  const renderCard = (id: CatalogIndicatorId, selectKey: string, selectedKey: string) => {
    const item = byId.get(id);
    const selected = state.selectedIndicatorId === id;
    const count = item?.count ?? 0;
    return (
      <button
        key={id}
        type="button"
        onClick={() => handleSelectIndicator(id)}
        aria-pressed={selected}
        className={cn(
          'rounded-lg border bg-card p-4 text-left transition-colors',
          selected
            ? 'border-foreground ring-1 ring-foreground'
            : 'border-border hover:bg-muted/40',
        )}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t(`semaspa.indicators.catalog.${id}.name`)}
        </p>
        <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight">
          {count.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {selected ? t(selectedKey) : t(selectKey)}
        </p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {VOLUME_CARD_ORDER.map((id) =>
          renderCard(
            id,
            'semaspa.indicators.cards.select',
            'semaspa.indicators.cards.selected',
          ),
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTOR_CARD_ORDER.map((id) =>
          renderCard(
            id,
            id === INDICATOR_IDS.PLATE_RECURRENT
              ? 'semaspa.indicators.cards.selectPlates'
              : 'semaspa.indicators.cards.selectPeople',
            id === INDICATOR_IDS.PLATE_RECURRENT
              ? 'semaspa.indicators.cards.selectedPlates'
              : 'semaspa.indicators.cards.selectedPeople',
          ),
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GF_CARD_ORDER.map((id) =>
          renderCard(
            id,
            'semaspa.indicators.cards.selectGfs',
            'semaspa.indicators.cards.selectedGfs',
          ),
        )}
      </div>
      {selectedIndicator ? null : (
        <span className="sr-only">{t('semaspa.indicators.cards.anyHint')}</span>
      )}
    </div>
  );
}
