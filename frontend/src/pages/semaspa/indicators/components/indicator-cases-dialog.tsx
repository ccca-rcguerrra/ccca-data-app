import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';

import type { IndicatorsController } from '../hooks/use-indicators-controller';

import { IndicatorPlateCasesTable } from './indicator-plate-cases-table';
import { IndicatorPersonCasesTable } from './indicator-person-cases-table';
import { IndicatorGfCasesTable } from './indicator-gf-cases-table';
import { IndicatorCasesTable } from './indicator-cases-table';

interface IndicatorCasesDialogProps {
  controller: IndicatorsController;
}

export function IndicatorCasesDialog({ controller }: IndicatorCasesDialogProps) {
  const { t } = useTranslation();
  const {
    api: { selectedIndicator, selectedEntity, pagination },
    store: { state },
    handlers: { handleCloseCasesDialog },
  } = controller;

  const title = selectedIndicator
    ? `${t('semaspa.indicators.list.title')} — ${t(
        `semaspa.indicators.catalog.${selectedIndicator.id}.name`,
      )}`
    : t('semaspa.indicators.list.title');

  const matchingKey =
    selectedEntity === 'person'
      ? 'matchingPeople'
      : selectedEntity === 'plate'
        ? 'matchingPlates'
        : selectedEntity === 'gf'
          ? 'matchingGfs'
          : 'matchingAutefs';

  const CasesTable =
    selectedEntity === 'person'
      ? IndicatorPersonCasesTable
      : selectedEntity === 'plate'
        ? IndicatorPlateCasesTable
        : selectedEntity === 'gf'
          ? IndicatorGfCasesTable
          : IndicatorCasesTable;

  return (
    <Dialog
      open={state.isCasesDialogOpen}
      onOpenChange={(open) => {
        if (!open) handleCloseCasesDialog();
      }}
    >
      <DialogContent className="flex max-h-[85vh] w-[1200px] max-w-[calc(100vw-2rem)] flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {pagination ? (
            <DialogDescription>
              {t(`semaspa.indicators.list.${matchingKey}`, { count: pagination.total })}
            </DialogDescription>
          ) : null}
        </DialogHeader>
        <div className="min-h-0 flex-1">
          <CasesTable controller={controller} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
