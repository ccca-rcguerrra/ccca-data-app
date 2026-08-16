import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';

import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import { INDICATOR_IDS } from '@/types/semaspa';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes.constants';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';

import {
  NO_MOVEMENT_FLAG_ID,
  type DossierFlagId,
} from '../utils/dossier-flags';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';
import { PersonLink } from '../../people/components/person-link';

import { VolumeBalanceGauge } from './volume-balance-gauge';

const FLAG_ORDER: DossierFlagId[] = [
  INDICATOR_IDS.OVER_EXTRACTED,
  INDICATOR_IDS.CREDIT_USE_OVER_90,
  INDICATOR_IDS.UNIT_CONFLICT,
  NO_MOVEMENT_FLAG_ID,
];

function flagNameKey(id: DossierFlagId): string {
  if (id === NO_MOVEMENT_FLAG_ID) return 'semaspa.autefs.dossier.flags.noMovement.name';
  return `semaspa.indicators.catalog.${id}.name`;
}

function flagRuleKey(id: DossierFlagId): string {
  if (id === NO_MOVEMENT_FLAG_ID) return 'semaspa.autefs.dossier.flags.noMovement.rule';
  return `semaspa.indicators.catalog.${id}.rule`;
}

function flagLimitationCount(id: DossierFlagId): number {
  return id === INDICATOR_IDS.CREDIT_USE_OVER_90 ? 3 : 2;
}

function flagLimitationKey(id: DossierFlagId, index: number): string {
  if (id === NO_MOVEMENT_FLAG_ID) {
    return `semaspa.autefs.dossier.flags.noMovement.limitations.${index}`;
  }
  return `semaspa.indicators.catalog.${id}.limitations.${index}`;
}

interface AutefDossierHeaderProps {
  controller: AutefDetailController;
}

export function AutefDossierHeader({ controller }: AutefDossierHeaderProps) {
  const { t } = useTranslation();
  const [selectedFlag, setSelectedFlag] = useState<DossierFlagId | null>(null);
  const {
    autef,
    isLoadingAutef,
    isLoadingDossierMeta,
    dossierFlags,
    dossierActors,
    headerHarvestUnits,
    harvestUnitTotal,
  } = controller.api;

  if (isLoadingAutef) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!autef) return null;

  const title = autef.number
    ? t('semaspa.autefs.detail.title', { number: autef.number })
    : t('semaspa.autefs.detail.untitled', { id: autef.id });

  const location = [autef.city, autef.state].filter(Boolean).join(' / ') || '—';
  const area =
    autef.totalAreaHa != null
      ? t('semaspa.autefs.detail.hectares', {
          value: autef.totalAreaHa.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        })
      : '—';

  const upaName = headerHarvestUnits[0]?.propertyName ?? null;
  const upaLabel =
    harvestUnitTotal > 1
      ? t('semaspa.autefs.detail.upaCount', { count: harvestUnitTotal })
      : upaName;

  const activeFlags = dossierFlags.activeFlagIds;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={ROUTES.root}>
            <ArrowLeft className="h-4 w-4" />
            {t('semaspa.autefs.detail.backToCenter')}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-fit">
          <Link to={ROUTES.semaspa.autefs}>{t('semaspa.autefs.detail.back')}</Link>
        </Button>
      </div>

      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.4px] text-muted-foreground">
          {t('semaspa.autefs.detail.eyebrow')}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('semaspa.autefs.detail.question')}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-mono text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {autef.title ? (
              <p className="text-sm text-muted-foreground mt-1">{autef.title}</p>
            ) : null}
          </div>
          {dossierFlags.peakMovedRatio != null ? (
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {t('semaspa.autefs.detail.peakMoved')}
              </span>
              <VolumeBalanceGauge ratio={dossierFlags.peakMovedRatio} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border pt-3 text-sm">
        <MetaField
          label={t('semaspa.autefs.detail.processNumber')}
          value={autef.processNumber ?? '—'}
          mono
        />
        <MetaField label={t('semaspa.autefs.detail.cityState')} value={location} />
        <MetaField label={t('semaspa.autefs.detail.totalAreaHa')} value={area} />
        <MetaField
          label={t('semaspa.autefs.detail.issuedAt')}
          value={
            autef.issuedAt
              ? `${formatISODateLocal(autef.issuedAt) || EMPTY_DATE_LABEL}${
                  autef.issueYear != null ? ` (${autef.issueYear})` : ''
                }`
              : EMPTY_DATE_LABEL
          }
        />
        <MetaField
          label={t('semaspa.autefs.detail.owner')}
          value={
            isLoadingDossierMeta && !dossierActors.owner
              ? '…'
              : dossierActors.owner ? (
                  <PersonLink personId={dossierActors.owner.personId}>
                    {dossierActors.owner.label}
                  </PersonLink>
                ) : (
                  '—'
                )
          }
        />
        <MetaField
          label={t('semaspa.autefs.detail.technicalResponsible')}
          value={
            isLoadingDossierMeta && !dossierActors.technicalResponsible
              ? '…'
              : dossierActors.technicalResponsible ? (
                  <PersonLink personId={dossierActors.technicalResponsible.personId}>
                    {dossierActors.technicalResponsible.label}
                  </PersonLink>
                ) : (
                  '—'
                )
          }
        />
        <MetaField
          label={t('semaspa.autefs.detail.analyst')}
          value={
            isLoadingDossierMeta && !dossierActors.analyst
              ? '…'
              : dossierActors.analyst ? (
                  <PersonLink personId={dossierActors.analyst.personId}>
                    {dossierActors.analyst.label}
                  </PersonLink>
                ) : (
                  '—'
                )
          }
        />
        <MetaField
          label={t('semaspa.autefs.detail.upa')}
          value={isLoadingDossierMeta && !upaLabel ? '…' : upaLabel ?? '—'}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {FLAG_ORDER.map((id) => {
            const active = activeFlags.includes(id);
            if (!active) return null;
            const selected = selectedFlag === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedFlag(selected ? null : id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  selected
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-card text-foreground hover:bg-muted/60',
                )}
              >
                {t(flagNameKey(id))}
              </button>
            );
          })}
          {isLoadingDossierMeta && activeFlags.length === 0 ? (
            <Skeleton className="h-7 w-32 rounded-full" />
          ) : null}
          {!isLoadingDossierMeta && activeFlags.length === 0 ? (
            <Badge variant="outline">{t('semaspa.autefs.dossier.noFlags')}</Badge>
          ) : null}
        </div>

        {selectedFlag && activeFlags.includes(selectedFlag) ? (
          <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-1.5">
            <p className="text-sm font-medium">{t(flagNameKey(selectedFlag))}</p>
            <p className="font-mono text-xs text-foreground">{t(flagRuleKey(selectedFlag))}</p>
            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
              {Array.from({ length: flagLimitationCount(selectedFlag) }, (_, index) => (
                <li key={index}>{t(flagLimitationKey(selectedFlag, index))}</li>
              ))}
            </ul>
          </div>
        ) : activeFlags.length > 0 ? (
          <p className="text-xs text-muted-foreground">{t('semaspa.autefs.dossier.selectFlag')}</p>
        ) : null}
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('font-medium', mono && 'font-mono text-[13px] tabular-nums')}>{value}</p>
    </div>
  );
}
