import axios from 'axios';
import type { TFunction } from 'i18next';

/**
 * Maps a forgot-password request failure to a user-facing localized message.
 */
export function getForgotPasswordErrorMessage(error: unknown, t: TFunction): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 400) {
      return t('auth.forgotPassword.errors.invalidData');
    }

    if (!error.response) {
      return t('auth.forgotPassword.errors.network');
    }
  }

  return t('auth.forgotPassword.errors.generic');
}
