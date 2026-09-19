import { useTranslation } from 'react-i18next';
import { AlertCircle, Download, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';

import { useIndicatorsController } from './hooks/use-indicators-controller';
import { IndicatorRulePanel } from './components/indicator-rule-panel';
import { IndicatorFilters } from './components/indicator-filters';
import { IndicatorCasesTable } from './components/indicator-cases-table';
import { IndicatorPersonCasesTable } from './components/indicator-person-cases-table';
import { IndicatorPlateCasesTable } from './components/indicator-plate-cases-table';
import { IndicatorGfCasesTable } from './components/indicator-gf-cases-table';
import { IndicatorCards } from './components/indicator-cards';

export function IndicatorsPage() {
  const { t } = useTranslation();
  const controller = useIndicatorsController();
  const busy = controller.api.isSummaryFetching || controller.api.isCasesFetching;

  if (controller.api.isError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over shrink-0" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.indicators.errors.title')}
          </h2>
          <p className="text-sm text-center text-foreground">
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
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-4 shrink-0 max-h-[48%] overflow-y-auto border-b border-border space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('semaspa.indicators.title')}
            </h2>
            <p className="text-sm text-muted-foreground font-normal leading-relaxed">
              {t('semaspa.indicators.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => void controller.handlers.handleExport()}
              disabled={busy || controller.api.isExporting}
            >
              <Download className="h-4 w-4" />
              {controller.api.isExporting
                ? t('semaspa.indicators.export.exporting')
                : t('semaspa.indicators.export.label')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={controller.handlers.handleRefresh}
              disabled={busy}
              aria-label={t('common.refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {controller.api.exportError ? (
          <p className="text-sm text-status-over" role="alert">
            {t('semaspa.indicators.export.failed')}
          </p>
        ) : null}

        <IndicatorCards controller={controller} />
        <IndicatorRulePanel controller={controller} />
        <IndicatorFilters controller={controller} />
      </div>

      <div className="px-4 pt-4 pb-1 shrink-0">
        <h3 className="text-sm font-medium text-foreground">
          {t('semaspa.indicators.list.title')}
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {controller.api.selectedEntity === 'person' ? (
          <IndicatorPersonCasesTable controller={controller} />
        ) : controller.api.selectedEntity === 'plate' ? (
          <IndicatorPlateCasesTable controller={controller} />
        ) : controller.api.selectedEntity === 'gf' ? (
          <IndicatorGfCasesTable controller={controller} />
        ) : (
          <IndicatorCasesTable controller={controller} />
        )}
      </div>
    </div>
  );
}
