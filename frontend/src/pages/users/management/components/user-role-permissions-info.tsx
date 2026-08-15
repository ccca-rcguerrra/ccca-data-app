import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatPermissionLabel,
  getEffectivePermissions,
  getRolePermissions,
  ROLE_SUMMARY,
  ROLE_SUMMARY_KEY,
} from '@/constants/role-permissions.constants';
import { USER_ROLE_LABEL, USER_ROLE_LABEL_KEY } from '@/constants/user-roles.constants';
import type { UserRole } from '@/types/users';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

interface RolePermissionsTooltipProps {
  role: UserRole;
  children?: React.ReactNode;
}

/**
 * Tooltip listing permissions granted by a single role.
 */
export function RolePermissionsTooltip({ role, children }: RolePermissionsTooltipProps) {
  const { t } = useTranslation();
  const permissions = getRolePermissions(role);
  const label = t(USER_ROLE_LABEL_KEY[role]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('users.rolePermissions.aboutAria')}
          >
            <Info className="size-3.5" aria-hidden />
          </button>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs p-3 text-left">
        <p className="mb-1 text-xs font-semibold">{label}</p>
        <p className="mb-2 text-[11px] text-muted-foreground leading-snug">{t(ROLE_SUMMARY_KEY[role])}</p>
        {permissions.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">{t('users.rolePermissions.noPermissions')}</p>
        ) : (
          <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-snug">
            {permissions.map((perm) => (
              <li key={perm}>{formatPermissionLabel(perm, t)}</li>
            ))}
          </ul>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface RolesColumnHeaderHintProps {
  label?: string;
}

function RolesPermissionsOverviewTooltip({ ariaLabel }: { ariaLabel: string }) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="inline-flex size-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          aria-label={ariaLabel}
        >
          <Info className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm p-3 text-left">
        <p className="mb-1 text-xs font-semibold">{t('users.rolePermissions.overviewTitle')}</p>
        <p className="text-[11px] text-muted-foreground leading-snug">
          {t('users.rolePermissions.overviewDescription')}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Info icon for the Roles table column header. */
export function RolesColumnHeaderHint({ label }: RolesColumnHeaderHintProps) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1">
      {label ?? t('users.management.table.roles')}
      <RolesPermissionsOverviewTooltip ariaLabel={t('users.rolePermissions.aboutAria')} />
    </span>
  );
}

/** Info icon next to the Roles label in the user form. */
export function RolesFormLabelHint() {
  const { t } = useTranslation();
  return <RolesPermissionsOverviewTooltip ariaLabel={t('users.rolePermissions.aboutAria')} />;
}

interface EffectivePermissionsSummaryProps {
  roles: UserRole[];
  className?: string;
}

/** Shows merged permissions for the currently selected roles in the form. */
export function EffectivePermissionsSummary({ roles, className }: EffectivePermissionsSummaryProps) {
  const { t } = useTranslation();
  if (roles.length === 0) return null;

  const effective = getEffectivePermissions(roles);

  return (
    <div
      className={cn(
        'rounded-md border border-border bg-muted/40 p-3 text-xs',
        className
      )}
    >
      <p className="mb-1.5 font-medium text-foreground">{t('users.rolePermissions.effectivePermissions')}</p>
      {effective.length === 0 ? (
        <p className="text-muted-foreground leading-snug">
          {t('users.rolePermissions.noEffectivePermissions')}
        </p>
      ) : (
        <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground leading-snug">
          {effective.map((perm) => (
            <li key={perm}>{formatPermissionLabel(perm, t)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface RoleOptionHintProps {
  role: UserRole;
}

/** Secondary line shown under each role in the form selector. */
export function RoleOptionHint({ role }: RoleOptionHintProps) {
  const { t } = useTranslation();
  return (
    <span className="text-[11px] text-muted-foreground leading-snug">{t(ROLE_SUMMARY_KEY[role])}</span>
  );
}
