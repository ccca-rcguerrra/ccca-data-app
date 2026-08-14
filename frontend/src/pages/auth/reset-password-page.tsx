import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth, useResetPasswordMutation } from '@/hooks/api/use-auth';
import { ROUTES } from '@/constants/routes.constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { AuthPageShell } from '@/pages/auth/components/auth-page-shell';
import { createResetPasswordSchema } from '@/pages/auth/schemas/reset-password.schema';
import {
  PASSWORD_RESET_SUCCESS_PARAM,
  RESET_TOKEN_PARAM,
} from '@/pages/auth/utils/auth-route.constants';
import { getResetPasswordErrorMessage } from '@/pages/auth/utils/get-reset-password-error-message';
import { resolveSafeReturnUrl } from '@/pages/auth/utils/resolve-safe-return-url';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const resetPasswordMutation = useResetPasswordMutation();

  const token = searchParams.get(RESET_TOKEN_PARAM)?.trim() ?? '';
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (isAuthenticated) {
    return <Navigate to={resolveSafeReturnUrl(null)} replace />;
  }

  if (!token) {
    return (
      <AuthPageShell
        footer={
          <div className="mt-6 space-y-2 text-center">
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to={ROUTES.auth.forgotPassword}>
                {t('auth.resetPassword.requestNewLink')}
              </Link>
            </Button>
            <div>
              <Button variant="link" className="h-auto p-0 text-sm" asChild>
                <Link to={ROUTES.auth.login}>{t('auth.common.backToLogin')}</Link>
              </Button>
            </div>
          </div>
        }
      >
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('auth.resetPassword.errors.missingTokenTitle')}</AlertTitle>
          <AlertDescription>{t('auth.resetPassword.errors.missingToken')}</AlertDescription>
        </Alert>
      </AuthPageShell>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setFieldErrors({});

    const parsed = schema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      const nextErrors: { password?: string; confirmPassword?: string } = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'password' || field === 'confirmPassword') {
          nextErrors[field] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password: parsed.data.password,
      });

      navigate(
        `${ROUTES.auth.login}?${PASSWORD_RESET_SUCCESS_PARAM}=1`,
        { replace: true }
      );
    } catch (error) {
      setSubmitError(getResetPasswordErrorMessage(error, t));
    }
  }

  return (
    <AuthPageShell
      footer={
        <div className="mt-6 space-y-2 text-center">
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link to={ROUTES.auth.forgotPassword}>
              {t('auth.resetPassword.requestNewLink')}
            </Link>
          </Button>
          <div>
            <Button variant="link" className="h-auto p-0 text-sm" asChild>
              <Link to={ROUTES.auth.login}>{t('auth.common.backToLogin')}</Link>
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-2 text-center">
        <h1 className="text-lg font-semibold">{t('auth.resetPassword.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.resetPassword.description')}</p>
      </div>

      {submitError ? (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('auth.resetPassword.errors.title')}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.resetPassword.newPassword')}</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                if (submitError) setSubmitError(null);
              }}
              placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
              autoComplete="new-password"
              autoFocus
              disabled={resetPasswordMutation.isPending}
              aria-invalid={Boolean(fieldErrors.password)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={
                showPassword
                  ? t('auth.resetPassword.hidePassword')
                  : t('auth.resetPassword.showPassword')
              }
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {fieldErrors.password ? (
            <p className="text-sm text-destructive">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }
                if (submitError) setSubmitError(null);
              }}
              placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
              autoComplete="new-password"
              disabled={resetPasswordMutation.isPending}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowConfirmPassword((value) => !value)}
              aria-label={
                showConfirmPassword
                  ? t('auth.resetPassword.hidePassword')
                  : t('auth.resetPassword.showPassword')
              }
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {fieldErrors.confirmPassword ? (
            <p className="text-sm text-destructive">{fieldErrors.confirmPassword}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
          {resetPasswordMutation.isPending
            ? t('auth.resetPassword.submitting')
            : t('auth.resetPassword.submit')}
        </Button>
      </form>
    </AuthPageShell>
  );
}
