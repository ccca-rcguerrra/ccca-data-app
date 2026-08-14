import { isRouteErrorResponse, Link, useRouteError } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

import { ROUTES } from '@/constants/routes.constants';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card';
import { Separator } from '@/components/ui/shadcn/separator';

const PAGE_BACKGROUND: React.CSSProperties = {
  background:
    'radial-gradient(circle at 12% 20%, rgba(14, 75, 59, 0.14), transparent 34%), radial-gradient(circle at 82% 72%, rgba(238, 207, 75, 0.18), transparent 38%), linear-gradient(135deg, #f5faf5 0%, #ffffff 48%, #f7f4e8 100%)',
};

function getErrorMessage(error: unknown): string | null {
  if (isRouteErrorResponse(error)) {
    return error.statusText || (typeof error.data === 'string' ? error.data : null);
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return null;
}

function getErrorStack(error: unknown): string | null {
  if (error instanceof Error && error.stack) {
    return error.stack;
  }
  return null;
}

/**
 * Custom route error page used as React Router `errorElement`.
 * Production shows a friendly UX; development also surfaces technical details.
 */
export function ErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();
  const isDev = import.meta.env.DEV;

  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  const title = isNotFound
    ? t('errors.boundary.notFoundTitle')
    : t('errors.boundary.title');
  const description = isNotFound
    ? t('errors.boundary.notFoundDescription')
    : t('errors.boundary.description');

  const message = getErrorMessage(error);
  const stack = getErrorStack(error);
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-8 sm:p-8"
      style={PAGE_BACKGROUND}
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

      <div className="relative flex w-full max-w-[480px] flex-col items-center gap-5">
        <Card className="w-full gap-0 rounded-lg border-white/70 bg-white/95 px-5 py-7 shadow-[0_18px_48px_rgba(15,23,42,0.14)] backdrop-blur sm:px-10 sm:py-8">
          <CardHeader className="space-y-4 p-0 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle className="size-7" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h1>
              {status != null && (
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  {t('errors.boundary.status', { status })}
                </p>
              )}
              <p className="text-sm leading-relaxed text-slate-500">{description}</p>
            </div>
          </CardHeader>

          <div className="my-5 flex items-center gap-4">
            <Separator className="flex-1 bg-slate-200" />
            <span className="size-2 rounded-full bg-primary" />
            <Separator className="flex-1 bg-slate-200" />
          </div>

          <CardContent className="space-y-4 p-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link to={ROUTES.root}>
                  <Home className="size-4" />
                  {t('errors.boundary.goHome')}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="size-4" />
                {t('errors.boundary.tryAgain')}
              </Button>
            </div>

            {isDev && (message || stack) && (
              <details className="rounded-md border border-slate-200 bg-slate-50 p-3 text-left">
                <summary className="cursor-pointer text-xs font-medium text-slate-600">
                  {t('errors.boundary.details')}
                </summary>
                {message && (
                  <p className="mt-3 text-sm font-medium text-slate-800">{message}</p>
                )}
                {stack && (
                  <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-500">
                    {stack}
                  </pre>
                )}
              </details>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ErrorPage;
