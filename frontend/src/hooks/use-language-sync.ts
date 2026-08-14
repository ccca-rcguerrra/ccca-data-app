import { useEffect } from 'react';

import { useAppConfig } from '@/hooks/api/use-app-config';
import { normalizeLocale } from '@/i18n/supported-locales';
import i18n from '@/i18n/index';
import { useSettingsStore } from '@/stores';

/**
 * Hook to synchronize language between settings store and i18n
 * This ensures the language is properly set when the app loads
 */
export function useLanguageSync() {
  const language = useSettingsStore((s) => s.language);
  const languageManuallySelected = useSettingsStore((s) => s.languageManuallySelected);
  const setDefaultLanguage = useSettingsStore((s) => s.setDefaultLanguage);
  const { data: appConfig } = useAppConfig();

  useEffect(() => {
    if (languageManuallySelected || !appConfig?.locale) return;
    setDefaultLanguage(normalizeLocale(appConfig.locale));
  }, [appConfig?.locale, languageManuallySelected, setDefaultLanguage]);

  useEffect(() => {
    // Sync the current language from store to i18n on mount
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return language;
}
