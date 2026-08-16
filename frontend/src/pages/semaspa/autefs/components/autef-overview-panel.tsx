import { useTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';

import { formatRatio } from '../utils/format';
import type { AutefDetailTabId } from '../store/use-autef-detail-store';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';

interface AutefOverviewPanelProps {
  controller: AutefDetailController;
}

export function AutefOverviewPanel({ controller }: AutefOverviewPanelProps) {
  const { t } = useTranslation();
  const {
    api: {
      dossierFlags,
      dossierActors,
      forestGuideTotal,
      harvestUnitTotal,
      actorTotal,
      isLoadingDossierMeta,
    },
    handlers: { handleActiveTabChange },
  } = controller;

  const openTab = (tab: AutefDetailTabId) => {
    handleActiveTabChange(tab);
  };

  if (isLoadingDossierMeta && dossierFlags.balanceRowCount === 0) {
    return (
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      tab: 'species' as const,
      title: t('semaspa.autefs.dossier.overview.speciesProducts'),
      value: String(dossierFlags.balanceRowCount),
      hint: t('semaspa.autefs.dossier.overview.peakRatioHint', {
        value: formatRatio(dossierFlags.peakMovedRatio),
      }),
    },
    {
      tab: 'species' as const,
      title: t('semaspa.autefs.dossier.overview.maxExcess'),
      value:
        dossierFlags.maxExcessVolume == null
          ? '—'
          : dossierFlags.maxExcessVolume.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            }),
      hint: t('semaspa.autefs.dossier.overview.overExtractedCount', {
        count: dossierFlags.overExtractedCount,
      }),
    },
    {
      tab: 'forestGuides' as const,
      title: t('semaspa.autefs.dossier.overview.forestGuides'),
      value: String(forestGuideTotal),
      hint: t('semaspa.autefs.dossier.overview.openLinked'),
    },
    {
      tab: 'harvestUnits' as const,
      title: t('semaspa.autefs.dossier.overview.harvestUnits'),
      value: String(harvestUnitTotal),
      hint: t('semaspa.autefs.dossier.overview.openLinked'),
    },
    {
      tab: 'roles' as const,
      title: t('semaspa.autefs.dossier.overview.actors'),
      value: String(actorTotal),
      hint: [
        dossierActors.owner?.label,
        dossierActors.technicalResponsible?.label,
        dossierActors.analyst?.label,
      ]
        .filter(Boolean)
        .join(' · ') || t('semaspa.autefs.dossier.overview.openLinked'),
    },
  ];

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={`${card.tab}-${card.title}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                {card.value}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2">{card.hint}</p>
              <Button variant="outline" size="sm" onClick={() => openTab(card.tab)}>
                {t('semaspa.autefs.dossier.overview.openTab')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
