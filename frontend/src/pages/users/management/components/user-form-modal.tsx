import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/shadcn/command';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { AlertTriangle, HelpCircle, KeyRound, Loader2, Mail, ShieldCheck, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip';
import type { CreateUserDto, UpdateUserDto, UserRole } from '@/types/users';
import { USER_ROLE_OPTIONS } from '@/constants/role-permissions.constants';
import { PERMISSIONS } from '@/constants/permissions';
import { usePermissions } from '@/hooks/use-permissions';
import {
  EffectivePermissionsSummary,
  RoleOptionHint,
  RolesFormLabelHint,
} from './user-role-permissions-info';
import { useUserByUserIdQuery } from '@/pages/users/hooks/use-users-content';
import { useCreateUserMutation, useUpdateUserMutation } from '@/pages/users/hooks/use-users-content';
import { useTeamsQuery } from '@/hooks/api/use-teams';

type UserStatusForm = 'active' | 'inactive' | 'blocked';

const STATUS_OPTIONS: { value: UserStatusForm; label: string; labelKey: string }[] = [
  { value: 'active', label: 'Active', labelKey: 'users.management.status.active' },
  { value: 'inactive', label: 'Inactive', labelKey: 'users.management.status.inactive' },
  { value: 'blocked', label: 'Blocked', labelKey: 'users.management.status.blocked' },
];

const statusToNumber: Record<UserStatusForm, number> = {
  active: 1,
  inactive: 0,
  blocked: -1,
};

const numberToStatus: Record<number, UserStatusForm> = {
  1: 'active',
  0: 'inactive',
  [-1]: 'blocked',
};

const EMPTY_TEAM_IDS: number[] = [];

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  userId: number | null;
  /** Pre-select teams when creating a user (e.g. opened from team dialog). */
  defaultTeamIds?: number[];
  onSuccess?: () => void;
}

/**
 * UserFormModal
 * Create or edit user in a modal.
 */
export function UserFormModal({
  open,
  onOpenChange,
  mode,
  userId,
  defaultTeamIds = EMPTY_TEAM_IDS,
  onSuccess,
}: UserFormModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';
  const defaultTeamIdsKey = useMemo(() => defaultTeamIds.join(','), [defaultTeamIds]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [status, setStatus] = useState<UserStatusForm>('inactive');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const userQuery = useUserByUserIdQuery(userId ?? 0, open && isEdit && !!userId);
  const teamsQuery = useTeamsQuery({ limit: 100 });
  const createMutation = useCreateUserMutation();
  const updateMutation = useUpdateUserMutation();
  const { can } = usePermissions();

  // Only admins can assign the "admin" and "coordinator" roles to other users.
  const canAssignPrivilegedRoles = can(PERMISSIONS.ADMIN_ACCESS);
  const roleOptions = useMemo(
    () =>
      canAssignPrivilegedRoles
        ? USER_ROLE_OPTIONS
        : USER_ROLE_OPTIONS.filter((opt) => opt.value !== 'admin' && opt.value !== 'coordinator'),
    [canAssignPrivilegedRoles],
  );

  const teamOptions = useMemo(() => {
    if (!teamsQuery.data?.data) return [];
    return [...teamsQuery.data.data].sort((a, b) => a.name.localeCompare(b.name));
  }, [teamsQuery.data]);

  const isLoadingUser = isEdit && userQuery.isLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;

    if (isEdit && userQuery.data) {
      const u = userQuery.data;
      setName(u.name ?? '');
      setEmail(u.email ?? '');
      setInstitution(u.institution ?? '');
      setSelectedTeamIds(u.teams?.map((t) => t.id) ?? EMPTY_TEAM_IDS);
      setSelectedRoles(u.roles ?? []);
      setStatus(numberToStatus[u.status] ?? 'inactive');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    } else if (!isEdit) {
      setName('');
      setEmail('');
      setInstitution('');
      setSelectedTeamIds(defaultTeamIds);
      setSelectedRoles([]);
      setStatus('inactive');
      setPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  }, [open, isEdit, userQuery.data, defaultTeamIds, defaultTeamIdsKey]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('users.form.errors.nameRequired');
    if (!isEdit && !email.trim()) next.email = t('users.form.errors.emailRequired');
    if (!isEdit) {
      if (!password.trim()) next.password = t('users.form.errors.passwordRequired');
      else if (password.length < 6) next.password = t('users.form.errors.passwordMinLength');
      if (!confirmPassword.trim()) next.confirmPassword = t('users.form.errors.confirmPasswordRequired');
      else if (password !== confirmPassword) next.confirmPassword = t('users.form.errors.passwordMismatch');
    } else {
      if (password.trim() || confirmPassword.trim()) {
        if (password.length < 6) next.password = t('users.form.errors.passwordMinLength');
        if (password !== confirmPassword) next.confirmPassword = t('users.form.errors.passwordMismatch');
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
      if (isEdit && userId != null && userQuery.data) {
        const payload: UpdateUserDto = {
          id: userId,
          name: name.trim(),
          email: email.trim(),
          status: statusToNumber[status],
          photo: userQuery.data.photo ?? null,
          institution: institution.trim() || undefined,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
          roles: selectedRoles,
        };
        if (password.trim()) payload.password = password.trim();
        await updateMutation.mutateAsync(payload);
      } else {
        const payload: CreateUserDto = {
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          status: statusToNumber[status],
          photo: null,
          institution: institution.trim() || undefined,
          teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
          roles: selectedRoles,
        };
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number }; message?: string };
      let msg: string = e?.response?.data?.message ?? e?.message ?? (isEdit ? t('users.form.errors.submitFailedEdit') : t('users.form.errors.submitFailedCreate'));
      const status = e?.response?.status;
      if (status !== undefined) {
        switch (status) {
          case 400: msg = t('users.form.errors.badRequest'); break;
          case 401: msg = t('users.form.errors.unauthorized'); break;
          case 403: msg = t('users.form.errors.forbidden'); break;
          case 404: msg = t('users.form.errors.notFound'); break;
          case 409: msg = t('users.form.errors.emailInUse'); break;
          case 500: msg = t('users.form.errors.serverError'); break;
          default: msg = isEdit ? t('users.form.errors.genericSave', { status }) : t('users.form.errors.genericCreate', { status });
        }
      }
      setErrors((prev) => ({ ...prev, submit: msg }));
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[min(90vh,52rem)] translate-x-[-50%] translate-y-[-50%] gap-4 overflow-y-auto rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-2xl',
          )}
        >
        <DialogHeader>
          <DialogTitle>{isEdit ? t('users.form.editTitle') : t('users.form.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('users.form.editDescription') : t('users.form.newDescription')}
          </DialogDescription>
        </DialogHeader>

        {errors.submit && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('users.form.errorTitle')}</AlertTitle>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {isLoadingUser ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('users.form.profile')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="user-name">
                    {t('users.form.fullName')} {!isEdit && <span className="text-destructive">*</span>}
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex shrink-0 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={t('users.form.nameHelp')}
                      >
                        <HelpCircle className="size-4" aria-hidden />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{t('users.form.nameTooltip')}</TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="user-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('users.form.namePlaceholder')}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="user-email">
                    {t('users.form.email')} {!isEdit && <span className="text-destructive">*</span>}
                  </Label>
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('users.form.emailPlaceholder')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('users.form.access')}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="user-institution">{t('users.form.institution')}</Label>
              <Input
                id="user-institution"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={t('users.form.institutionPlaceholder')}
                maxLength={500}
                aria-invalid={!!errors.institution}
              />
              {errors.institution && (
                <p className="text-sm text-destructive">{errors.institution}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="grid gap-2">
                <Label>{t('users.form.teams')}</Label>
                <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={teamsQuery.isLoading}
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-10 w-full justify-between border-dashed font-normal',
                    )}
                  >
                    <span className="truncate">
                      {selectedTeamIds.length > 0
                        ? t('users.form.teamsSelected', { count: selectedTeamIds.length })
                        : t('users.form.selectTeams')}
                    </span>
                    <Users className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t('users.form.searchTeams')} />
                    <CommandEmpty>{t('users.form.noTeamFound')}</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {teamOptions.map((team) => {
                        const checked = selectedTeamIds.includes(team.id);
                        return (
                          <CommandItem
                            key={team.id}
                            onSelect={() => {
                              setSelectedTeamIds((prev) =>
                                checked ? prev.filter((id) => id !== team.id) : [...prev, team.id],
                              );
                            }}
                            className="flex items-center gap-2"
                          >
                            <Checkbox checked={checked} />
                            <span className="text-sm">{team.name}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-1">
                  <Label>{t('users.form.roles')}</Label>
                  <RolesFormLabelHint />
                </div>
                <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      buttonVariants({ variant: 'outline' }),
                      'h-10 w-full justify-between border-dashed font-normal',
                    )}
                  >
                    <span className="truncate">
                      {selectedRoles.length > 0
                        ? t('users.form.rolesSelected', { count: selectedRoles.length })
                        : t('users.form.selectRoles')}
                    </span>
                    <ShieldCheck className="size-4 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandGroup className="max-h-72 overflow-y-auto">
                      {roleOptions.map((opt) => {
                        const checked = selectedRoles.includes(opt.value);
                        return (
                          <CommandItem
                            key={opt.value}
                            onSelect={() => {
                              setSelectedRoles((prev) =>
                                checked ? prev.filter((r) => r !== opt.value) : [...prev, opt.value],
                              );
                            }}
                            className="flex items-start gap-2 py-2"
                          >
                            <Checkbox checked={checked} className="mt-0.5" />
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="text-sm font-medium">{t(opt.labelKey)}</span>
                              <RoleOptionHint role={opt.value} />
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
                <EffectivePermissionsSummary roles={selectedRoles} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-status">{t('users.form.status')}</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as UserStatusForm)}
              >
                <SelectTrigger id="user-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('users.form.security')}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="user-password">
                {t('users.form.password')} {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? t('users.form.passwordEditPlaceholder') : t('users.form.passwordPlaceholder')}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-confirm-password">
                {t('users.form.confirmPassword')} {!isEdit && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="user-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={isEdit ? t('users.form.confirmPasswordEditPlaceholder') : t('users.form.confirmPasswordPlaceholder')}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('users.form.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoadingUser || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {isEdit ? t('users.form.saveChanges') : t('users.form.createUser')}
          </Button>
        </DialogFooter>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
