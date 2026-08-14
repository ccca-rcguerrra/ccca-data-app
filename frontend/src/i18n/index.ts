import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { StorageService } from '@/services/storage/storage.service';
import { STORAGE_KEYS } from '@/constants/storage.constants';

import { DEFAULT_LOCALE, normalizeLocale } from './supported-locales';
import enUS from './locales/en-US.json';

const resources = {
  'en-US': {
    translation: enUS,
  },
};

const getStoredLanguage = () => {
  try {
    const settings = StorageService.readPersistedState<{ language?: string }>(
      STORAGE_KEYS.SETTINGS,
    );
    if (settings?.language) {
      return normalizeLocale(settings.language);
    }
  } catch (error) {
    console.warn('Error reading language from localStorage:', error);
  }
  return DEFAULT_LOCALE;
};

i18n.use(initReactI18next).init({
  resources,
  lng: getStoredLanguage(),
  fallbackLng: DEFAULT_LOCALE,
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV === 'development',
});

export default i18n;
