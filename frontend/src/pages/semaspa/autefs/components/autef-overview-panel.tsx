import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { ROUTES } from '@/constants/routes.constants';

import { formatPersonLabel, formatRatio } from '../utils/format';
import type { AutefDetailTabId } from '../store/use-autef-detail-store';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';
import { PersonLink } from '../../people/components/person-link';
import { personRoleI18nKey } from '../../people/utils/role-label';

interface AutefOverviewPanelProps {
  controller: AutefDetailController;
}

export function AutefOverviewPanel({ controller }: AutefOverviewPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    api: {
      dossierFlags,
      dossierActors,
      forestGuideTotal,
      harvestUnitTotal,
      actorTotal,
      plateTotal,
      relatedAutefs,
      isLoadingRelated,
      peopleMap,
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
    {
      tab: 'plates' as const,
      title: t('semaspa.autefs.dossier.overview.plates'),
      value: String(plateTotal),
      hint: t('semaspa.autefs.dossier.overview.openLinked'),
    },
  ];

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {t('semaspa.autefs.related.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRelated ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </div>
          ) : relatedAutefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('semaspa.autefs.related.empty')}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>{t('semaspa.autefs.related.number')}</TableHead>
                    <TableHead>{t('semaspa.autefs.related.city')}</TableHead>
                    <TableHead>{t('semaspa.autefs.related.sharedRole')}</TableHead>
                    <TableHead>{t('semaspa.autefs.related.person')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedAutefs.map((row) => {
                    const roleKey = personRoleI18nKey(row.sharedRole);
                    return (
                      <TableRow
                        key={`${row.autefId}-${row.sharedRole}-${row.personId}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(
                            ROUTES.semaspa.autefDetail.replace(':id', String(row.autefId)),
                          )
                        }
                      >
                        <TableCell className="font-mono text-[13px] font-medium">
                          {row.number ?? `#${row.autefId}`}
                        </TableCell>
                        <TableCell>{row.city ?? '—'}</TableCell>
                        <TableCell>{roleKey ? t(roleKey) : row.sharedRole}</TableCell>
                        <TableCell onClick={(event) => event.stopPropagation()}>
                          <PersonLink personId={row.personId}>
                            {formatPersonLabel(peopleMap[row.personId], row.personId)}
                          </PersonLink>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
