import { useTranslation } from 'react-i18next';

import type { GeneralStatisticsTotals } from '@/types/semaspa';
import { useLocaleFormat } from '@/hooks/use-locale-format';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Card, CardContent } from '@/components/ui/shadcn/card';

interface StatisticsOverviewProps {
  totals?: GeneralStatisticsTotals;
  isLoading?: boolean;
}

export function StatisticsOverview({ totals, isLoading }: StatisticsOverviewProps) {
  const { t } = useTranslation();
  const { locale, formatNumber } = useLocaleFormat();

  const percentFormatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  });

  const items = [
    {
      label: t('semaspa.statistics.totals.autefs'),
      value: totals ? formatNumber(totals.autefs) : '',
      color: 'text-foreground',
    },
    {
      label: t('semaspa.statistics.totals.gfs'),
      value: totals ? formatNumber(totals.gfs) : '',
      color: 'text-foreground',
    },
    {
      label: t('semaspa.statistics.totals.autefsSemGf'),
      value: totals ? formatNumber(totals.autefsSemGf) : '',
      color: 'text-[#c2413b]',
    },
    {
      label: t('semaspa.statistics.totals.coverage'),
      value: totals ? `${percentFormatter.format(totals.coveragePct)}%` : '',
      color: 'text-[#0e4b3b]',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            {isLoading && !totals ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p
                className={`mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight ${item.color}`}
              >
                {item.value}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
