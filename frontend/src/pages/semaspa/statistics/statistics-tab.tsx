import { useTranslation } from 'react-i18next';
import { useState, type MutableRefObject } from 'react';
import { AlertCircle } from 'lucide-react';

import {
  useStatisticsByMonthQuery,
  useStatisticsSummaryQuery,
} from '@/hooks/api/use-semaspa';
import { downloadBlob } from '@/utils/download';
import { Button } from '@/components/ui/shadcn/button';

import { StatisticsOverview } from './components/statistics-overview';
import { StatisticsByYear } from './components/statistics-by-year';
import { StatisticsByMonth } from './components/statistics-by-month';

export interface StatisticsTabActions {
  refresh: () => void;
  exportCsv: () => void;
}

interface StatisticsTabProps {
  actionsRef: MutableRefObject<StatisticsTabActions | null>;
}

function csvCell(value: string | number): string {
  return `"${String(value).split('"').join('""')}"`;
}

export function StatisticsTab({ actionsRef }: StatisticsTabProps) {
  const { t } = useTranslation();
  const summaryQuery = useStatisticsSummaryQuery();
  const [year, setYear] = useState<number | null>(null);

  const byYear = summaryQuery.data?.byYear ?? [];
  const years = byYear.map((item) => item.year);
  const lastYear = years[years.length - 1];
  const selectedYear = year ?? lastYear ?? new Date().getFullYear();

  const byMonthQuery = useStatisticsByMonthQuery(selectedYear, {
    enabled: years.length > 0,
  });

  actionsRef.current = {
      refresh: () => {
        void summaryQuery.refetch();
        void byMonthQuery.refetch();
      },
      exportCsv: () => {
        const summary = summaryQuery.data;
        if (!summary) return;
        const months = byMonthQuery.data?.months ?? [];
        const lines = [
          ['metric', 'value'].map(csvCell).join(','),
          ['autefs', summary.totals.autefs].map(csvCell).join(','),
          ['forest_guides', summary.totals.gfs].map(csvCell).join(','),
          ['autefs_without_gf', summary.totals.autefsSemGf].map(csvCell).join(','),
          ['gf_coverage_pct', summary.totals.coveragePct].map(csvCell).join(','),
          '',
          ['year', 'autefs', 'forest_guides'].map(csvCell).join(','),
          ...summary.byYear.map((item) =>
            [item.year, item.autefs, item.gfs].map(csvCell).join(','),
          ),
          '',
          ['year', 'month', 'autefs', 'forest_guides', 'autefs_without_gf'].map(csvCell).join(','),
          ...months.map((item) =>
            [selectedYear, item.month, item.autefs, item.gfs, item.autefsSemGf]
              .map(csvCell)
              .join(','),
          ),
        ];
        downloadBlob(
          new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }),
          `statistics-${selectedYear}.csv`,
        );
      },
    };

  if (summaryQuery.isError) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6">
        <div
          className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 shrink-0 text-status-over" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.indicators.errors.title')}
          </h2>
          <Button variant="outline" size="sm" onClick={() => void summaryQuery.refetch()}>
            {t('errors.boundary.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-4">
      <StatisticsOverview
        totals={summaryQuery.data?.totals}
        isLoading={summaryQuery.isLoading}
      />

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">{t('semaspa.statistics.byYear.title')}</h3>
        <StatisticsByYear byYear={byYear} />
      </div>

      <StatisticsByMonth
        year={selectedYear}
        years={years}
        months={byMonthQuery.data?.months ?? []}
        isLoading={byMonthQuery.isLoading}
        onYearChange={setYear}
      />
    </div>
  );
}
