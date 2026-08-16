import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';

import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ForestGuideStatusBadge } from '../../forest-guides/components/forest-guide-status-badge';
import type { SpeciesProduct, VolumeBalanceForestGuide } from '@/types/semaspa';

import { formatExcess, formatRatio, formatVolume } from '../utils/format';
import type { MergedAutefSpeciesRow } from '../hooks/use-autef-detail-controller';

interface AutefCreditInspectorProps {
  row: MergedAutefSpeciesRow | null;
  product: SpeciesProduct | undefined;
  contributions: VolumeBalanceForestGuide[];
  contributionsTotal: number;
  movedVolumeSum: number | null;
  crossingForestGuideId: number | null;
  isLoadingContributions: boolean;
  onOpenForestGuide: (id: number) => void;
}

function volumesDiffer(a: number | null, b: number | null): boolean {
  const left = a ?? 0;
  const right = b ?? 0;
  return Math.abs(left - right) > 0.0005;
}

export function AutefCreditInspector({
  row,
  product,
  contributions,
  contributionsTotal,
  movedVolumeSum,
  crossingForestGuideId,
  isLoadingContributions,
  onOpenForestGuide,
}: AutefCreditInspectorProps) {
  const { t } = useTranslation();
  const balance = row?.balance ?? null;

  if (!row || !balance) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        {t('semaspa.autefs.species.selected.empty')}
      </div>
    );
  }

  const limitationCount = 4;
  const showMismatch = volumesDiffer(movedVolumeSum, balance.movedVolume);
  const crossingGuide =
    crossingForestGuideId == null
      ? null
      : (contributions.find((guide) => guide.forestGuideId === crossingForestGuideId) ??
        null);
  const crossingLabel =
    crossingGuide?.number ??
    (crossingForestGuideId != null ? String(crossingForestGuideId) : null);

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('semaspa.autefs.species.selected.title')}
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          {product?.commonName ?? t('semaspa.autefs.species.selected.unknownSpecies')}
        </p>
        <p className="text-xs italic text-muted-foreground">
          {product?.scientificName ?? '—'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {product?.productName ?? '—'}
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{t('semaspa.autefs.species.authorized')}</dt>
          <dd className="tabular-nums font-medium">
            {formatVolume(balance.authorizedVolume, balance.authorizedUnit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('semaspa.autefs.species.moved')}</dt>
          <dd className="tabular-nums font-medium">
            {formatVolume(balance.movedVolume, balance.movedUnit)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {t('semaspa.autefs.species.selected.authorizedUnit')}
          </dt>
          <dd className="tabular-nums">{balance.authorizedUnit ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            {t('semaspa.autefs.species.selected.movedUnit')}
          </dt>
          <dd className="tabular-nums">{balance.movedUnit ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('semaspa.autefs.species.excess')}</dt>
          <dd className="tabular-nums">{formatExcess(balance.excessVolume)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t('semaspa.autefs.species.ratioPercent')}</dt>
          <dd className="tabular-nums">{formatRatio(balance.movedRatio)}</dd>
        </div>
        {row.original ? (
          <div>
            <dt className="text-xs text-muted-foreground">
              {t('semaspa.autefs.species.selected.original')}
            </dt>
            <dd className="tabular-nums">
              {formatVolume(row.original.volume, row.original.unit)}
            </dd>
          </div>
        ) : null}
      </dl>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('semaspa.autefs.species.contributions.title')}
        </p>
        {isLoadingContributions && contributions.length === 0 ? (
          <div className="mt-2 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : null}
        {!isLoadingContributions && contributions.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('semaspa.autefs.species.contributions.empty')}
          </p>
        ) : null}
        {contributions.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {contributions.map((guide) => {
              const crossed = guide.forestGuideId === crossingForestGuideId;
              return (
                <li
                  key={guide.forestGuideId}
                  className="rounded-md border border-border p-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => onOpenForestGuide(guide.forestGuideId)}
                    >
                      <p className="font-mono text-[13px] font-medium">{guide.number ?? '—'}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {guide.issuedAt
                          ? formatISODateLocal(guide.issuedAt) || EMPTY_DATE_LABEL
                          : EMPTY_DATE_LABEL}
                      </p>
                      <p className="text-xs tabular-nums">
                        {t('semaspa.autefs.species.contributions.deltaEquals', {
                          delta: formatVolume(guide.volume, guide.unit),
                          running: formatVolume(guide.runningTotal, guide.unit),
                        })}
                      </p>
                    </button>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <ForestGuideStatusBadge status={guide.status} />
                      {crossed ? (
                        <Badge variant="outline">
                          {t('semaspa.autefs.species.contributions.crossed')}
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => onOpenForestGuide(guide.forestGuideId)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {t('semaspa.autefs.species.contributions.view')}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          <p>{t('semaspa.autefs.species.contributions.total', { count: contributionsTotal })}</p>
          <p>
            {t('semaspa.autefs.species.contributions.movedSum', {
              sum: formatVolume(movedVolumeSum, balance.movedUnit),
            })}
          </p>
          {showMismatch ? (
            <p>
              {t('semaspa.autefs.species.contributions.movedMismatch', {
                moved: formatVolume(balance.movedVolume, balance.movedUnit),
              })}
            </p>
          ) : null}
          {crossingLabel ? (
            <p>
              {t('semaspa.autefs.species.contributions.crossedHint', {
                number: crossingLabel,
              })}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-foreground">
          {t('semaspa.autefs.species.selected.limitationsTitle')}
        </p>
        <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
          {Array.from({ length: limitationCount }, (_, index) => (
            <li key={index}>{t(`semaspa.autefs.species.selected.limitations.${index}`)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
