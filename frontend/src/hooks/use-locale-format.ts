import { useMemo } from 'react';

import { useSettingsStore } from '@/stores/settings-store';
import { formatISODateLocal, formatISODateTime } from '@/utils/date';

export interface LocaleFormatters {
  locale: string;
  formatNumber: (value: number | null | undefined, emptyLabel?: string) => string;
  formatPercent: (value: number | null | undefined, emptyLabel?: string) => string;
  formatArea: (value: number | null | undefined, emptyLabel?: string) => string;
  formatDate: (value: string | null | undefined, emptyLabel?: string) => string;
  formatDateTime: (value: string | null | undefined, emptyLabel?: string) => string;
}

const EMPTY_LABEL = '—';

export function useLocaleFormat(): LocaleFormatters {
  const locale = useSettingsStore((s) => s.language);

  return useMemo(() => {
    const numberFormatter = new Intl.NumberFormat(locale);
    const percentFormatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
      style: 'percent',
    });
    const areaFormatter = new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
    });

    return {
      locale,
      formatNumber: (value, emptyLabel = EMPTY_LABEL) => (
        value == null ? emptyLabel : numberFormatter.format(value)
      ),
      formatPercent: (value, emptyLabel = EMPTY_LABEL) => (
        value == null ? emptyLabel : percentFormatter.format(value)
      ),
      formatArea: (value, emptyLabel = EMPTY_LABEL) => (
        value == null ? emptyLabel : `${areaFormatter.format(value)} ha`
      ),
      formatDate: (value, emptyLabel = EMPTY_LABEL) => (
        formatISODateLocal(value, locale, undefined, emptyLabel)
      ),
      formatDateTime: (value, emptyLabel = EMPTY_LABEL) => (
        formatISODateTime(value, locale, undefined, emptyLabel)
      ),
    };
  }, [locale]);
}
