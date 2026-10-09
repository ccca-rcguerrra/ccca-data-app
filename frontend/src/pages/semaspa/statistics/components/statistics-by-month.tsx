import { useTranslation } from 'react-i18next';

import type { GeneralStatisticsMonthItem } from '@/types/semaspa';
import { useLocaleFormat } from '@/hooks/use-locale-format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cn } from '@/lib/utils';

interface StatisticsByMonthProps {
  year: number;
  years: number[];
  months: GeneralStatisticsMonthItem[];
  isLoading?: boolean;
  onYearChange: (year: number) => void;
}

const COL_COUNT = 4;

function monthLabel(month: number, locale: string): string {
  const label = new Intl.DateTimeFormat(locale, { month: 'long' }).format(
    new Date(2000, month - 1, 1),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function StatisticsByMonth({
  year,
  years,
  months,
  isLoading,
  onYearChange,
}: StatisticsByMonthProps) {
  const { t } = useTranslation();
  const { locale, formatNumber } = useLocaleFormat();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">{t('semaspa.statistics.byMonth.title')}</h3>
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-0.5">
          {years.map((item) => (
            <button
              key={item}
              type="button"
              className={cn(
                'rounded-md px-2.5 py-1 text-xs',
                item === year
                  ? 'bg-background font-semibold text-foreground shadow-sm'
                  : 'text-muted-foreground',
              )}
              onClick={() => onYearChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>{t('semaspa.statistics.byMonth.month')}</TableHead>
              <TableHead className="text-right">{t('semaspa.statistics.byMonth.autefs')}</TableHead>
              <TableHead className="text-right">{t('semaspa.statistics.byMonth.gfs')}</TableHead>
              <TableHead className="text-right">{t('semaspa.statistics.byMonth.semGf')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && months.length === 0
              ? Array.from({ length: 12 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: COL_COUNT }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}

            {!isLoading && months.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="h-24 text-center text-sm text-muted-foreground">
                  {t('semaspa.indicators.list.noResultsWithFilters')}
                </TableCell>
              </TableRow>
            ) : null}

            {months.map((item) => (
              <TableRow key={item.month}>
                <TableCell>{monthLabel(item.month, locale)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(item.autefs)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(item.gfs)}</TableCell>
                <TableCell className="text-right tabular-nums text-[#c2413b]">
                  {formatNumber(item.autefsSemGf)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
