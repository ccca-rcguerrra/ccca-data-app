import axios from 'axios';
import type { TFunction } from 'i18next';

/**
 * Maps a reset-password request failure to a user-facing localized message.
 */
export function getResetPasswordErrorMessage(error: unknown, t: TFunction): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;

    if (status === 400) {
      return t('auth.resetPassword.errors.invalidToken');
    }

    if (!error.response) {
      return t('auth.resetPassword.errors.network');
    }
  }

  return t('auth.resetPassword.errors.generic');
}
