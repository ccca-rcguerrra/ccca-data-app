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
        <p className="text-sm font-medium text-foreground">
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

  const groups: Array<{
    label: string;
    ids: CatalogIndicatorId[];
    columns: string;
    selectKey: (id: CatalogIndicatorId) => string;
    selectedKey: (id: CatalogIndicatorId) => string;
  }> = [
    {
      label: t('semaspa.indicators.groups.volume'),
      ids: VOLUME_CARD_ORDER,
      columns: 'sm:grid-cols-3',
      selectKey: () => 'semaspa.indicators.cards.select',
      selectedKey: () => 'semaspa.indicators.cards.selected',
    },
    {
      label: t('semaspa.indicators.groups.actors'),
      ids: ACTOR_CARD_ORDER,
      columns: 'sm:grid-cols-3',
      selectKey: (id) =>
        id === INDICATOR_IDS.PLATE_RECURRENT
          ? 'semaspa.indicators.cards.selectPlates'
          : 'semaspa.indicators.cards.selectPeople',
      selectedKey: (id) =>
        id === INDICATOR_IDS.PLATE_RECURRENT
          ? 'semaspa.indicators.cards.selectedPlates'
          : 'semaspa.indicators.cards.selectedPeople',
    },
    {
      label: t('semaspa.indicators.groups.guides'),
      ids: GF_CARD_ORDER,
      columns: 'sm:grid-cols-2',
      selectKey: () => 'semaspa.indicators.cards.selectGfs',
      selectedKey: () => 'semaspa.indicators.cards.selectedGfs',
    },
  ];

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className={cn('grid grid-cols-1 gap-3', group.columns)}>
            {group.ids.map((id) => renderCard(id, group.selectKey(id), group.selectedKey(id)))}
          </div>
        </section>
      ))}
      {selectedIndicator ? null : (
        <span className="sr-only">{t('semaspa.indicators.cards.anyHint')}</span>
      )}
    </div>
  );
}
