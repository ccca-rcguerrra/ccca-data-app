import { useTranslation } from 'react-i18next';

import { formatISODateTime } from '@/utils/date';

import type { IndicatorsController } from '../hooks/use-indicators-controller';

interface IndicatorRulePanelProps {
  controller: IndicatorsController;
}

export function IndicatorRulePanel({ controller }: IndicatorRulePanelProps) {
  const { t } = useTranslation();
  const indicator = controller.api.selectedIndicator;
  const generatedAt = controller.api.summary?.generatedAt;

  if (!indicator) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        {t('semaspa.indicators.rule.anyDescription')}
      </div>
    );
  }

  const limitationCount = indicator.limitations.length;

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {t(`semaspa.indicators.catalog.${indicator.id}.name`)}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">
          {t('semaspa.indicators.rule.meta', {
            version: indicator.ruleVersion,
            generatedAt: generatedAt
              ? formatISODateTime(generatedAt)
              : t('semaspa.indicators.rule.unknownTime'),
          })}
        </p>
      </div>
      <p className="font-mono text-xs text-foreground">
        {t(`semaspa.indicators.catalog.${indicator.id}.rule`)}
      </p>
      <p className="text-xs text-muted-foreground">
        {t('semaspa.indicators.rule.inputs', {
          inputs: indicator.inputs.join(', '),
        })}
      </p>
      <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
        {Array.from({ length: limitationCount }, (_, index) => (
          <li key={index}>
            {t(`semaspa.indicators.catalog.${indicator.id}.limitations.${index}`)}
          </li>
        ))}
      </ul>
    </div>
  );
}
