import { useRef } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Button } from '@/components/ui/shadcn/button';

import { StatisticsTab, type StatisticsTabActions } from '../statistics/statistics-tab';

import { useIndicatorsController } from './hooks/use-indicators-controller';
import { IndicatorRulePanel } from './components/indicator-rule-panel';
import { IndicatorCasesDialog } from './components/indicator-cases-dialog';
import { IndicatorCards } from './components/indicator-cards';

export function IndicatorsPage() {
  const { t } = useTranslation();
  const controller = useIndicatorsController();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') === 'estatisticas' ? 'estatisticas' : 'indicadores';

  const title =
    tab === 'estatisticas'
      ? t('semaspa.statistics.title')
      : t('semaspa.indicators.title');
  const subtitle =
    tab === 'estatisticas'
      ? t('semaspa.statistics.subtitle')
      : t('semaspa.indicators.subtitle');

  const statisticsActionsRef = useRef<StatisticsTabActions | null>(null);

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'estatisticas') next.set('tab', 'estatisticas');
    else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  const handleRefresh = () => {
    if (tab === 'estatisticas') {
      statisticsActionsRef.current?.refresh();
      return;
    }
    controller.handlers.handleRefresh();
  };

  const handleExport = async () => {
    if (tab === 'estatisticas') {
      statisticsActionsRef.current?.exportCsv();
      return;
    }
    const exported = await controller.handlers.handleExport();
    if (!exported) toast.error(t('semaspa.indicators.export.failed'));
  };

  if (controller.api.isError) {
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
          <p className="text-center text-sm text-foreground">
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('semaspa.indicators.errors.message')}
          </p>
          <Button variant="outline" size="sm" onClick={controller.handlers.handleRefresh}>
            {t('errors.boundary.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs
        value={tab}
        onValueChange={handleTabChange}
        className="flex h-full min-h-0 flex-col"
      >
        <div className="flex flex-col gap-4 px-6 pt-6">
          <TabsList className="w-fit shrink-0">
            <TabsTrigger value="indicadores">
              {t('semaspa.indicators.tabs.indicadores')}
            </TabsTrigger>
            <TabsTrigger value="estatisticas">
              {t('semaspa.indicators.tabs.estatisticas')}
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
              <p className="max-w-xl text-sm font-normal leading-relaxed text-muted-foreground">
                {subtitle}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                disabled={controller.api.isExporting}
                onClick={() => void handleExport()}
              >
                <Download className="h-4 w-4" />
                {controller.api.isExporting
                  ? t('semaspa.indicators.export.exporting')
                  : t('semaspa.indicators.export.label')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={handleRefresh}
                aria-label={t('common.refresh')}
              >
                <RefreshCw
                  className={`h-4 w-4 ${controller.api.isSummaryFetching ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="indicadores" className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-4 p-6 pb-4">
            <IndicatorCards controller={controller} />
            <IndicatorRulePanel controller={controller} />
          </div>
          <IndicatorCasesDialog controller={controller} />
        </TabsContent>

        <TabsContent value="estatisticas" className="min-h-0 flex-1 overflow-y-auto">
          <StatisticsTab actionsRef={statisticsActionsRef} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
