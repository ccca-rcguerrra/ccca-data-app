import axios from 'axios';
import type { TFunction } from 'i18next';

/**
 * Maps a login request failure to a user-facing localized message.
 */
export function getLoginErrorMessage(error: unknown, t: TFunction): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 401) {
      return t('auth.login.errors.invalidCredentials');
    }

    if (status === 400) {
      return t('auth.login.errors.invalidData');
    }

    if (!error.response) {
      return t('auth.login.errors.network');
    }
  }

  return t('auth.login.errors.generic');
}
