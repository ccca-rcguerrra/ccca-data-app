import type { UserRole } from '@/types/users';

/** Human-readable label for each user role (matches backend UserRole enum). */
export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  analyst_senior: 'Analyst Senior',
  analyst_midlevel: 'Analyst Midlevel',
  analyst_junior: 'Analyst Junior',
  analyst_support: 'Analyst Support',
  viewer: 'Viewer',
};

/** i18n key for each user role label. */
export const USER_ROLE_LABEL_KEY: Record<UserRole, string> = {
  admin: 'users.roles.admin',
  coordinator: 'users.roles.coordinator',
  analyst_senior: 'users.roles.analystSenior',
  analyst_midlevel: 'users.roles.analystMidlevel',
  analyst_junior: 'users.roles.analystJunior',
  analyst_support: 'users.roles.analystSupport',
  viewer: 'users.roles.viewer',
};

/** Formats auth/API role slugs for display in the UI.
 *  When `t` is provided, labels are translated. Falls back to the English label. */
export function formatUserRolesDisplay(
  roles?: string[] | null,
  t?: (key: string) => string,
): string | null {
  if (!roles?.length) return null;
  return roles
    .map((role) => {
      const key = USER_ROLE_LABEL_KEY[role as UserRole];
      return key && t ? t(key) : USER_ROLE_LABEL[role as UserRole] ?? role.replace(/_/g, ' ');
    })
    .join(' · ');
}
