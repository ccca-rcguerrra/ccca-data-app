import type { User, UserRole } from '@/types/users';
import { USER_ROLE_LABEL, USER_ROLE_LABEL_KEY } from '@/constants/user-roles.constants';

/**
 * User status for list UI
 */
export type UserStatusUI = 'active' | 'inactive' | 'blocked';

export { type UserRole, USER_ROLE_LABEL, USER_ROLE_LABEL_KEY };

/**
 * User row data for users management table
 */
export interface UserRowData {
  id: string;
  name: string;
  email: string;
  institution: string;
  roles: UserRole[];
  teams: string[];
  biomes: string[];
  status: UserStatusUI;
  createdAt: string;
  lastLogin: string;
  avatar?: string;
  hasFullAccess?: boolean;
}

/**
 * Status display config for list UI
 */
export const USER_STATUS_CONFIG: Record<
  UserStatusUI,
  { label: string; labelKey: string; indicator: string; badge: string }
> = {
  active: {
    label: 'Active',
    labelKey: 'users.management.status.active',
    indicator: 'bg-emerald-500',
    badge: 'border-emerald-200 text-emerald-700 bg-emerald-50',
  },
  inactive: {
    label: 'Inactive',
    labelKey: 'users.management.status.inactive',
    indicator: 'bg-slate-300',
    badge: 'border-slate-200 text-slate-700 bg-slate-50',
  },
  blocked: {
    label: 'Blocked',
    labelKey: 'users.management.status.blocked',
    indicator: 'bg-red-500',
    badge: 'border-red-200 text-red-700 bg-red-50',
  },
};

const statusMap: Record<number, UserStatusUI> = {
  1: 'active',
  0: 'inactive',
  [-1]: 'blocked',
};

/**
 * Convert API User to table row format
 */
export function convertUserToRowData(user: User): UserRowData {
  const teamNames = user.teams?.map((team) => team.name) ?? [];
  const biomeNames =
    user.teams?.flatMap((team) =>
      (team.territories ?? [])
        .filter(
          (t) =>
            t.category === 'biome' ||
            (t.categoryName?.toLowerCase().includes('biome') ?? false)
        )
        .map((t) => t.name)
    ) ?? [];

  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    institution: user.institution ?? '',
    roles: user.roles ?? [],
    teams: teamNames,
    biomes: [...new Set(biomeNames)],
    status: statusMap[user.status] ?? 'inactive',
    createdAt: user.createdAt,
    lastLogin: user.updatedAt,
    avatar: user.photo ?? undefined,
  };
}

/**
 * Format date for display (e.g. "Jan 16, 2026, 3:50 PM")
 */
export function formatRelativeDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(isoDate));
}

/**
 * Format age for display (e.g. "5d ago", "2mo ago")
 */
export function formatAge(isoDate: string, t?: (key: string, opts?: object) => string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return t ? t('users.management.age.days', { count: days }) : `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return t ? t('users.management.age.months', { count: months }) : `${months}mo ago`;
  const years = Math.floor(months / 12);
  return t ? t('users.management.age.years', { count: years }) : `${years}y ago`;
}
