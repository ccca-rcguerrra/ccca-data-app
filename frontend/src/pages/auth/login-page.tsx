import { Link, Navigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LockKeyhole,
  Mail,
} from 'lucide-react';

import {
  resolveSafeReturnUrl,
  RETURN_URL_PARAM,
} from '@/pages/auth/utils/resolve-safe-return-url';
import { getLoginErrorMessage } from '@/pages/auth/utils/get-login-error-message';
import { PASSWORD_RESET_SUCCESS_PARAM } from '@/pages/auth/utils/auth-route.constants';
import { AuthPageShell } from '@/pages/auth/components/auth-page-shell';
import { useAuth } from '@/hooks/api/use-auth';
import { ROUTES } from '@/constants/routes.constants';
import { Label } from '@/components/ui/shadcn/label';
import { Input } from '@/components/ui/shadcn/input';
import { CardDescription, CardTitle } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/shadcn/alert';

interface LoginFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  isLoading,
  onSubmit,
}: LoginFormProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div className="mb-5 text-center">
        <CardTitle className="text-xl font-bold text-slate-950">
          {t('auth.login.welcome')}
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-slate-500">
          {t('auth.login.description')}
        </CardDescription>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
          {t('auth.login.email')}
        </Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder={t('auth.login.emailPlaceholder')}
            autoComplete="email"
            autoFocus
            required
            disabled={isLoading}
            className="h-10 rounded-lg border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-none placeholder:text-slate-500 focus-visible:border-[#006681] focus-visible:ring-[#006681]/15"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-sm font-semibold text-slate-900"
        >
          {t('auth.login.password')}
        </Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder={t('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
            required
            disabled={isLoading}
            className="h-10 rounded-lg border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 shadow-none placeholder:text-slate-500 focus-visible:border-[#006681] focus-visible:ring-[#006681]/15"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:bg-transparent hover:text-slate-700"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isLoading}
            aria-label={
              showPassword
                ? t('auth.resetPassword.hidePassword')
                : t('auth.resetPassword.showPassword')
            }
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-xs font-medium text-blue-600 hover:text-blue-700"
          asChild
        >
          <Link to={ROUTES.auth.forgotPassword}>
            {t('auth.login.forgotPassword')}
          </Link>
        </Button>
      </div>
      <Button
        type="submit"
        className="h-10 w-full rounded-lg bg-[#087236] text-sm font-semibold shadow-[0_10px_18px_rgba(8,114,54,0.18)] hover:bg-[#06632f]"
        disabled={isLoading}
      >
        <Lock className="size-4" />
        {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
      </Button>
      {/*
        TODO: Implement Google authentication.
        <div className="flex items-center gap-3 py-0.5 text-xs text-slate-500">
          <Separator className="flex-1 bg-slate-200" />
          <span>{t('auth.login.or')}</span>
          <Separator className="flex-1 bg-slate-200" />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full rounded-lg border-slate-300 bg-white text-sm font-semibold text-slate-800 shadow-none hover:bg-slate-50"
          aria-label={t('auth.login.googleSignIn')}
        >
          <span className="text-lg font-bold leading-none">
            <span className="text-[#4285F4]">G</span>
          </span>
          {t('auth.login.googleSignIn')}
        </Button>
      */}
      <p className="pt-2 text-center text-xs text-slate-500">
        {t('auth.login.noAccount')}{' '}
        <span className="font-medium text-blue-600">
          {t('auth.login.contactAdmin')}
        </span>
      </p>
    </form>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { login, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const returnUrl = searchParams.get(RETURN_URL_PARAM);
  const passwordResetSuccess =
    searchParams.get(PASSWORD_RESET_SUCCESS_PARAM) === '1';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    try {
      await login({ email, password });
    } catch (error) {
      setSubmitError(getLoginErrorMessage(error, t));
    }
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    if (submitError) setSubmitError(null);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (submitError) setSubmitError(null);
  }

  if (isAuthenticated) {
    return <Navigate to={resolveSafeReturnUrl(returnUrl)} replace />;
  }

  return (
    <AuthPageShell>
      {passwordResetSuccess ? (
        <Alert className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle>{t('auth.login.passwordResetSuccess.title')}</AlertTitle>
          <AlertDescription>
            {t('auth.login.passwordResetSuccess.description')}
          </AlertDescription>
        </Alert>
      ) : null}

      {submitError ? (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('auth.login.errors.title')}</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      ) : null}

      <LoginForm
        email={email}
        onEmailChange={handleEmailChange}
        password={password}
        onPasswordChange={handlePasswordChange}
        isLoading={isLoading}
        onSubmit={handleSubmit}
      />
    </AuthPageShell>
  );
}
