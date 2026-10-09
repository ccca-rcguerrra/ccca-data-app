import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import type { GeneralStatisticsYearItem } from '@/types/semaspa';

interface StatisticsByYearProps {
  byYear: GeneralStatisticsYearItem[];
}

export function StatisticsByYear({ byYear }: StatisticsByYearProps) {
  const { t } = useTranslation();

  const option = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: {
        data: [
          t('semaspa.statistics.byYear.autefs'),
          t('semaspa.statistics.byYear.gfs'),
        ],
      },
      grid: { left: 64, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: byYear.map((item) => String(item.year)),
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: t('semaspa.statistics.byYear.autefs'),
          type: 'bar',
          data: byYear.map((item) => item.autefs),
          itemStyle: { color: '#0e4b3b' },
        },
        {
          name: t('semaspa.statistics.byYear.gfs'),
          type: 'bar',
          data: byYear.map((item) => item.gfs),
          itemStyle: { color: '#d9a514' },
        },
      ],
    }),
    [byYear, t],
  );

  return <ReactECharts option={option} style={{ height: 320 }} />;
}
