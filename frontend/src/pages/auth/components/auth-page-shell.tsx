import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { StorageService } from '@/services/storage/storage.service';
import i18n from '@/i18n';
import { usePublicInitiativeMetadata } from '@/hooks/api/use-app-config';
import { STORAGE_KEYS } from '@/constants';
import { Separator } from '@/components/ui/shadcn/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card';
import { CountryFlag } from '@/components/ui/country-flag';

/** Idioma padrão das telas de autenticação quando o usuário ainda não tem preferência salva. */
const AUTH_FALLBACK_LOCALE = 'en-US';

const AUTH_BACKGROUND: React.CSSProperties = {
  background:
    'radial-gradient(circle at 12% 20%, rgba(14, 75, 59, 0.14), transparent 34%), radial-gradient(circle at 82% 72%, rgba(238, 207, 75, 0.18), transparent 38%), linear-gradient(135deg, #f5faf5 0%, #ffffff 48%, #f7f4e8 100%)',
};

interface AuthPageShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Shared layout for unauthenticated auth pages (login, forgot password, reset password).
 */
export function AuthPageShell({ children, footer }: AuthPageShellProps) {
  const { t } = useTranslation();
  const { data: initiative } = usePublicInitiativeMetadata();

  // Sem preferência salva no localStorage → telas de autenticação usam inglês por padrão.
  useEffect(() => {
    const hasStoredSettings = StorageService.has(STORAGE_KEYS.SETTINGS);
    if (!hasStoredSettings && i18n.language !== AUTH_FALLBACK_LOCALE) {
      void i18n.changeLanguage(AUTH_FALLBACK_LOCALE);
    }
  }, []);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:p-8"
      style={AUTH_BACKGROUND}
    >
      <div className="pointer-events-none absolute -left-24 -top-16 h-[34rem] w-[34rem] rotate-45 opacity-55">
        <div className="absolute left-2 top-8 size-16 bg-[#dbe8df]/55" />
        <div className="absolute left-36 top-48 size-14 bg-[#dbe8df]/40" />
        <div className="absolute left-60 top-58 size-14 bg-[#dbe8df]/35" />
        <div className="absolute left-6 top-80 size-14 bg-[#dbe8df]/40" />
        <div className="absolute left-16 top-20 size-44 border border-[#cbd8cf]/65" />
        <div className="absolute left-42 top-10 size-28 border border-[#cbd8cf]/60" />
        <div className="absolute left-12 top-60 size-36 border border-[#cbd8cf]/55" />
        <div className="absolute left-48 top-32 size-20 border border-[#cbd8cf]/50" />
      </div>
      <div className="pointer-events-none absolute -bottom-[25rem] -right-48 size-[46rem] rounded-full border border-[#eecf4b]/35" />
      <div className="pointer-events-none absolute -bottom-[22rem] -right-40 size-[41rem] rounded-full border border-[#eecf4b]/30" />
      <div className="pointer-events-none absolute -bottom-[19rem] -right-32 size-[36rem] rounded-full border border-[#0e4b3b]/20" />

      <div className="relative flex w-full max-w-[448px] flex-col items-center gap-5">
        <Card className="w-full gap-0 rounded-lg border-white/70 bg-white/95 px-5 py-7 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur sm:px-10 sm:py-8">
          <CardHeader className="space-y-0 p-0 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2">
                <img
                  src="/images/logo-full.png"
                  alt={t('auth.login.logoAlt')}
                  className="h-16 w-auto max-w-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/images/logo.png';
                  }}
                />
                <CountryFlag countryCode={initiative?.countryCode} countryName={initiative?.country} />
              </div>
              <span className="mt-1.5 text-sm font-medium text-slate-500">
                {t('auth.login.subtitle')}
              </span>
            </div>
          </CardHeader>
          <div className="my-5 flex items-center gap-4">
            <Separator className="flex-1 bg-slate-200" />
            <span className="size-2 rounded-full bg-primary" />
            <Separator className="flex-1 bg-slate-200" />
          </div>
          <CardContent className="p-0">
            {children}
            {footer}
          </CardContent>
        </Card>
        <p className="text-center text-xs text-slate-500">
          {t('auth.login.copyright')}
        </p>
      </div>
    </div>
  );
}
