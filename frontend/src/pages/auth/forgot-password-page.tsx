import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth, useForgotPasswordMutation } from '@/hooks/api/use-auth';
import { ROUTES } from '@/constants/routes.constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { AuthPageShell } from '@/pages/auth/components/auth-page-shell';
import { getForgotPasswordErrorMessage } from '@/pages/auth/utils/get-forgot-password-error-message';
import { resolveSafeReturnUrl } from '@/pages/auth/utils/resolve-safe-return-url';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const forgotPasswordMutation = useForgotPasswordMutation();

  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={resolveSafeReturnUrl(null)} replace />;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    try {
      await forgotPasswordMutation.mutateAsync({ email: email.trim() });
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(getForgotPasswordErrorMessage(error, t));
    }
  }

  return (
    <AuthPageShell
      footer={
        <div className="mt-6 text-center">
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link to={ROUTES.auth.login}>{t('auth.common.backToLogin')}</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold">{t('auth.forgotPassword.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.forgotPassword.description')}</p>
      </div>

      {isSubmitted ? (
        <Alert className="mt-6 border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>{t('auth.forgotPassword.success.title')}</AlertTitle>
          <AlertDescription>{t('auth.forgotPassword.success.description')}</AlertDescription>
        </Alert>
      ) : (
        <>
          {submitError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{t('auth.forgotPassword.errors.title')}</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder={t('auth.login.emailPlaceholder')}
                autoComplete="email"
                autoFocus
                required
                disabled={forgotPasswordMutation.isPending}
              />
            </div>

            <Button type="submit" className="w-full" disabled={forgotPasswordMutation.isPending}>
              {forgotPasswordMutation.isPending
                ? t('auth.forgotPassword.submitting')
                : t('auth.forgotPassword.submit')}
            </Button>
          </form>
        </>
      )}
    </AuthPageShell>
  );
}
