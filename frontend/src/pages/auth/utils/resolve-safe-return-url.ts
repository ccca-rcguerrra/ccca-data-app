import { ROUTES } from '@/constants/routes.constants';

const RETURN_URL_PARAM = 'returnUrl';

/**
 * Validates and returns a safe internal path for post-login redirect.
 */
export function resolveSafeReturnUrl(returnUrl: string | null | undefined): string {
  if (!returnUrl) {
    return ROUTES.root;
  }

  const trimmed = returnUrl.trim();

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return ROUTES.root;
  }

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes('\\')) {
    return ROUTES.root;
  }

  if (trimmed.startsWith(ROUTES.auth.login)) {
    return ROUTES.root;
  }

  if (
    trimmed.startsWith(ROUTES.auth.forgotPassword) ||
    trimmed.startsWith(ROUTES.auth.resetPassword)
  ) {
    return ROUTES.root;
  }

  return trimmed;
}

/**
 * Builds the login URL with an encoded return path.
 */
export function buildLoginUrlWithReturn(returnPath: string): string {
  return `${ROUTES.auth.login}?${RETURN_URL_PARAM}=${encodeURIComponent(returnPath)}`;
}

export { RETURN_URL_PARAM };
