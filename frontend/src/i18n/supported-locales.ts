export const SUPPORTED_LOCALES = [
  {
    code: 'en-US',
    name: 'English (United States)',
    nativeName: 'English (United States)',
  },
] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]['code'];

export const DEFAULT_LOCALE: AppLocale = 'en-US';

const SUPPORTED_LOCALE_CODES = new Set<string>(
  SUPPORTED_LOCALES.map((locale) => locale.code),
);

export function isSupportedLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && SUPPORTED_LOCALE_CODES.has(value);
}

export function normalizeLocale(value: unknown): AppLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
