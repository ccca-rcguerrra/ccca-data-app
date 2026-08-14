import { z } from 'zod';
import type { TFunction } from 'i18next';

const MIN_PASSWORD_LENGTH = 6;

export function createResetPasswordSchema(t: TFunction) {
  return z
    .object({
      password: z
        .string()
        .min(1, t('auth.resetPassword.errors.passwordRequired'))
        .min(MIN_PASSWORD_LENGTH, t('auth.resetPassword.errors.passwordMinLength')),
      confirmPassword: z
        .string()
        .min(1, t('auth.resetPassword.errors.confirmPasswordRequired')),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('auth.resetPassword.errors.passwordMismatch'),
      path: ['confirmPassword'],
    });
}

export type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;
