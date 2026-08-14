import { PERMISSIONS, type Permission } from '@/constants/permissions';
import { USER_ROLE_LABEL, USER_ROLE_LABEL_KEY } from '@/constants/user-roles.constants';
import type { UserRole } from '@/types/users';

/**
 * Human-readable permission labels (mirrors backend auth.permissions.ts).
 */
export const PERMISSION_LABEL: Record<Permission, string> = {
  [PERMISSIONS.ACTIVATIONS_CREATE]: 'Create activations and pre-validation workflows',
  [PERMISSIONS.REFINEMENTS_APPROVE]: 'Approve alert refinements',
  [PERMISSIONS.REFINEMENTS_REJECT]: 'Reject alert refinements',
  [PERMISSIONS.AUDIT_APPROVE]: 'Approve alerts in audit',
  [PERMISSIONS.AUDIT_REJECT]: 'Reject or revise alerts in audit',
  [PERMISSIONS.ALERTS_CHANGE_STATUS]: 'Manually change alert status (cancel/reopen published alerts)',
  [PERMISSIONS.ALERTS_CHANGE_CLASS]: 'Manually change the deforestation class of an alert',
  [PERMISSIONS.SUPPORTS_MANAGE]: 'Manage support cases',
  [PERMISSIONS.USERS_MANAGE]: 'Manage users',
  [PERMISSIONS.TEAMS_MANAGE]: 'Manage teams',
  [PERMISSIONS.WORKING_OVERRIDE]: 'Dismiss alerts reserved by other analysts',
  [PERMISSIONS.ADMIN_ACCESS]: 'Full administrative access',
};

/** i18n key for each permission label. */
export const PERMISSION_LABEL_KEY: Record<Permission, string> = {
  [PERMISSIONS.ACTIVATIONS_CREATE]: 'users.permissions.activationsCreate',
  [PERMISSIONS.REFINEMENTS_APPROVE]: 'users.permissions.refinementsApprove',
  [PERMISSIONS.REFINEMENTS_REJECT]: 'users.permissions.refinementsReject',
  [PERMISSIONS.AUDIT_APPROVE]: 'users.permissions.auditApprove',
  [PERMISSIONS.AUDIT_REJECT]: 'users.permissions.auditReject',
  [PERMISSIONS.ALERTS_CHANGE_STATUS]: 'users.permissions.alertsChangeStatus',
  [PERMISSIONS.ALERTS_CHANGE_CLASS]: 'users.permissions.alertsChangeClass',
  [PERMISSIONS.SUPPORTS_MANAGE]: 'users.permissions.supportsManage',
  [PERMISSIONS.USERS_MANAGE]: 'users.permissions.usersManage',
  [PERMISSIONS.TEAMS_MANAGE]: 'users.permissions.teamsManage',
  [PERMISSIONS.WORKING_OVERRIDE]: 'users.permissions.workingOverride',
  [PERMISSIONS.ADMIN_ACCESS]: 'users.permissions.adminAccess',
};

/**
 * Role → permissions map (mirrors backend ROLE_PERMISSIONS).
 * Each role lists all permissions it grants; multiple roles are merged on the server.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  admin: Object.values(PERMISSIONS),
  coordinator: [
    PERMISSIONS.ACTIVATIONS_CREATE,
    PERMISSIONS.REFINEMENTS_APPROVE,
    PERMISSIONS.REFINEMENTS_REJECT,
    PERMISSIONS.AUDIT_APPROVE,
    PERMISSIONS.AUDIT_REJECT,
    PERMISSIONS.ALERTS_CHANGE_STATUS,
    PERMISSIONS.ALERTS_CHANGE_CLASS,
    PERMISSIONS.SUPPORTS_MANAGE,
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.TEAMS_MANAGE,
    PERMISSIONS.WORKING_OVERRIDE,
  ],
  analyst_senior: [
    PERMISSIONS.ACTIVATIONS_CREATE,
    PERMISSIONS.REFINEMENTS_APPROVE,
    PERMISSIONS.REFINEMENTS_REJECT,
    PERMISSIONS.AUDIT_APPROVE,
    PERMISSIONS.AUDIT_REJECT,
  ],
  analyst_midlevel: [
    PERMISSIONS.ACTIVATIONS_CREATE,
    PERMISSIONS.REFINEMENTS_APPROVE,
    PERMISSIONS.REFINEMENTS_REJECT,
  ],
  analyst_junior: [PERMISSIONS.ACTIVATIONS_CREATE],
  analyst_support: [PERMISSIONS.SUPPORTS_MANAGE],
  viewer: [],
};

/** Short summary for role pickers (one line). */
export const ROLE_SUMMARY: Record<UserRole, string> = {
  admin: 'All system permissions',
  coordinator: 'Operations, audit, refinement, users, teams, and supports',
  analyst_senior: 'Pre-validation, refinement, and audit',
  analyst_midlevel: 'Pre-validation and refinement',
  analyst_junior: 'Pre-validation and image selection only',
  analyst_support: 'Support cases module only',
  viewer: 'Read-only access (no workflow actions)',
};

/** i18n key for each role summary. */
export const ROLE_SUMMARY_KEY: Record<UserRole, string> = {
  admin: 'users.roleSummaries.admin',
  coordinator: 'users.roleSummaries.coordinator',
  analyst_senior: 'users.roleSummaries.analystSenior',
  analyst_midlevel: 'users.roleSummaries.analystMidlevel',
  analyst_junior: 'users.roleSummaries.analystJunior',
  analyst_support: 'users.roleSummaries.analystSupport',
  viewer: 'users.roleSummaries.viewer',
};

export const USER_ROLE_OPTIONS: { value: UserRole; label: string; labelKey: string }[] = (
  Object.keys(USER_ROLE_LABEL) as UserRole[]
).map((value) => ({
  value,
  label: USER_ROLE_LABEL[value],
  labelKey: USER_ROLE_LABEL_KEY[value],
}));

export function getRolePermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Union of permissions for multiple roles (same logic as backend computePermissions). */
export function getEffectivePermissions(roles: UserRole[]): Permission[] {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const perm of getRolePermissions(role)) {
      set.add(perm);
    }
  }
  return [...set];
}

export function formatPermissionLabel(
  permission: Permission,
  t?: (key: string) => string,
): string {
  return t
    ? t(PERMISSION_LABEL_KEY[permission] ?? permission)
    : PERMISSION_LABEL[permission] ?? permission;
}
