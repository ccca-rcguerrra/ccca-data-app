import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/shadcn/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
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
import { AlertTriangle, Loader2, Plus, Search, UserMinus, UserPlus, Users } from 'lucide-react';
import type { CreateTeam, UpdateTeam } from '@/types/teams';
import type { UserRole } from '@/types/users';
import { useTeamQuery, useCreateTeamMutation, useUpdateTeamMutation } from '@/hooks/api/use-teams';
import { useTerritoriesQuery } from '@/hooks/api/use-territories';
import { useTerritoryFilters } from '@/hooks/api/use-app-config';
import { useUsersQuery } from '@/hooks/api/use-users';
import { useUpdateUserMutation } from '@/pages/users/hooks/use-users-content';
import { UserFormModal } from '@/pages/users/management/components/user-form-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { USER_ROLE_LABEL, USER_ROLE_LABEL_KEY } from '@/constants/user-roles.constants';
import { USER_STATUS_CONFIG } from '@/pages/users/management/types';
import type { UserStatusUI } from '@/pages/users/management/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';

interface TeamFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  teamId: string | null;
  onSuccess?: () => void;
}

const USER_STATUS_BY_API: Record<number, UserStatusUI> = {
  1: 'active',
  0: 'inactive',
  [-1]: 'blocked',
};

/** Fixed modal height; members table scrolls inside MEMBERS_TABLE_HEIGHT */
const MODAL_HEIGHT_CLASS = 'h-[min(90vh,42rem)]';
const MEMBERS_TABLE_HEIGHT_CLASS = 'h-80';

function memberInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * TeamFormModal
 * Create or edit a team: details (name + territory) and members table in one view.
 */
export function TeamFormModal({
  open,
  onOpenChange,
  mode,
  teamId,
  onSuccess,
}: TeamFormModalProps) {
  const { t } = useTranslation();
  const isEdit = mode === 'edit';
  const teamIdNum = teamId ? Number(teamId) : 0;
  const defaultTeamIdsForNewUser = useMemo(
    () => (teamIdNum > 0 ? [teamIdNum] : []),
    [teamIdNum],
  );

  const [name, setName] = useState('');
  const [territoryId, setTerritoryId] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Members tab state ───────────────────────────────────────────────────────
  const [memberIds, setMemberIds] = useState<Set<number>>(new Set());
  const [originalMemberIds, setOriginalMemberIds] = useState<Set<number>>(new Set());
  const [addPopoverOpen, setAddPopoverOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [userModalOpen, setUserModalOpen] = useState(false);

  const { can } = usePermissions();
  const canManageUsers = can(PERMISSIONS.USERS_MANAGE);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const teamQuery = useTeamQuery(teamIdNum, open && isEdit && !!teamId);

  const { teamFilters } = useTerritoryFilters();
  const territoriesQuery = useTerritoriesQuery(
    { page: 1, limit: 100, category: teamFilters },
    { enabled: open }
  );

  // All users — for the "add member" dropdown
  const allUsersQuery = useUsersQuery(
    { limit: 200 },
    { enabled: open && isEdit }
  );

  // Current team members — for initializing memberIds
  const teamMembersQuery = useUsersQuery(
    { teamId: [teamIdNum], limit: 200 },
    { enabled: open && isEdit && teamIdNum > 0 }
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useCreateTeamMutation();
  const updateMutation = useUpdateTeamMutation();
  const updateUserMutation = useUpdateUserMutation();

  // ── Derived data ─────────────────────────────────────────────────────────────
  const territoryOptions = useMemo(() => {
    const raw = territoriesQuery.data?.data;
    if (!Array.isArray(raw)) return [];
    return [...raw].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [territoriesQuery.data]);

  const allUsers = useMemo(() => {
    const users = allUsersQuery.data?.data ?? [];
    return [...users].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [allUsersQuery.data]);

  // Users already in the team (full objects for display)
  const currentMembers = useMemo(
    () => allUsers.filter((u) => memberIds.has(u.id)),
    [allUsers, memberIds]
  );

  const filteredMembers = useMemo(() => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return currentMembers;
    return currentMembers.filter((user) => {
      const roleLabels = (user.roles ?? []).map(
        (role) => t(USER_ROLE_LABEL_KEY[role as UserRole] ?? role),
      );
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        roleLabels.some((label) => label.toLowerCase().includes(query))
      );
    });
  }, [currentMembers, memberSearch]);

  // Users not yet in the team — candidates for the "add" popover
  const availableToAdd = useMemo(
    () => allUsers.filter((u) => !memberIds.has(u.id)),
    [allUsers, memberIds]
  );

  const hasMemberChanges = useMemo(() => {
    if (memberIds.size !== originalMemberIds.size) return true;
    for (const id of memberIds) if (!originalMemberIds.has(id)) return true;
    return false;
  }, [memberIds, originalMemberIds]);

  const isLoadingTeam = isEdit && (teamQuery.isLoading || teamMembersQuery.isLoading);
  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || updateUserMutation.isPending;

  // ── Effects ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setName('');
      setTerritoryId('');
      setErrors({});
      setMemberIds(new Set());
      setOriginalMemberIds(new Set());
      setAddPopoverOpen(false);
      setMemberSearch('');
      setUserModalOpen(false);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (isEdit && teamQuery.data) {
      const t = teamQuery.data;
      setName(t.name ?? '');
      const tid = t.territoryId ?? t.territories?.[0]?.id;
      setTerritoryId(tid != null ? String(tid) : '');
    } else if (!isEdit) {
      setName('');
      setTerritoryId('');
    }
  }, [open, isEdit, teamQuery.data]);

  useEffect(() => {
    if (!open || !isEdit) return;
    if (teamMembersQuery.data) {
      const ids = new Set(teamMembersQuery.data.data.map((u) => u.id));
      setMemberIds(ids);
      setOriginalMemberIds(ids);
    }
  }, [open, isEdit, teamMembersQuery.data]);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('teams.management.form.nameRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const addMember = (userId: number) => {
    setMemberIds((prev) => new Set([...prev, userId]));
    setAddPopoverOpen(false);
  };

  const removeMember = (userId: number) => {
    setMemberIds((prev) => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  };

  const applyMemberChanges = async () => {
    const allUsersMap = new Map(allUsers.map((u) => [u.id, u]));
    const toAdd = [...memberIds].filter((id) => !originalMemberIds.has(id));
    const toRemove = [...originalMemberIds].filter((id) => !memberIds.has(id));

    await Promise.all([
      ...toAdd.map((userId) => {
        const user = allUsersMap.get(userId);
        const currentTeamIds = user?.teams?.map((t) => t.id) ?? [];
        return updateUserMutation.mutateAsync({
          id: userId,
          teamIds: [...currentTeamIds, teamIdNum],
        });
      }),
      ...toRemove.map((userId) => {
        const user = allUsersMap.get(userId);
        const currentTeamIds = (user?.teams?.map((t) => t.id) ?? []).filter(
          (id) => id !== teamIdNum
        );
        return updateUserMutation.mutateAsync({ id: userId, teamIds: currentTeamIds });
      }),
    ]);

    const newIds = new Set(memberIds);
    setOriginalMemberIds(newIds);
  };

  const handleUserCreated = useCallback(async () => {
    setUserModalOpen(false);
    await Promise.all([allUsersQuery.refetch(), teamMembersQuery.refetch()]);
  }, [allUsersQuery, teamMembersQuery]);

  const handleSubmit = async () => {
    if (!validate()) return;
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
      if (isEdit && teamIdNum > 0 && teamQuery.data) {
        const payload: UpdateTeam = {
          name: name.trim(),
          territoryId: territoryId ? Number(territoryId) : null,
        };
        await updateMutation.mutateAsync({ id: teamIdNum, team: payload });
        if (hasMemberChanges) await applyMemberChanges();
      } else {
        const payload: CreateTeam = {
          name: name.trim(),
          territoryId: territoryId ? Number(territoryId) : null,
        };
        await createMutation.mutateAsync(payload);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      let msg: string =
        e?.response?.data?.message ??
        e?.message ??
        (isEdit ? t('teams.management.form.errors.submitFailedEdit') : t('teams.management.form.errors.submitFailedCreate'));
      const status = e?.response?.status;
      if (status !== undefined) {
        switch (status) {
          case 400: msg = t('teams.management.form.errors.badRequest'); break;
          case 401: msg = t('teams.management.form.errors.unauthorized'); break;
          case 403: msg = t('teams.management.form.errors.forbidden'); break;
          case 404: msg = t('teams.management.form.errors.notFound'); break;
          case 409: msg = t('teams.management.form.errors.conflict'); break;
          case 500: msg = t('teams.management.form.errors.serverError'); break;
          default: msg = isEdit ? t('teams.management.form.errors.genericSave', { status }) : t('teams.management.form.errors.genericCreate', { status });
        }
      }
      setErrors((prev) => ({ ...prev, submit: msg }));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] flex-col translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-lg border p-6 shadow-lg duration-200 outline-none sm:max-w-4xl',
            MODAL_HEIGHT_CLASS,
          )}
        >
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEdit ? t('teams.management.form.editTitle') : t('teams.management.form.newTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('teams.management.form.editDescription') : t('teams.management.form.newDescription')}
          </DialogDescription>
        </DialogHeader>

        {errors.submit && (
          <Alert variant="destructive" className="shrink-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('teams.management.form.errorTitle')}</AlertTitle>
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {isLoadingTeam ? (
          <div className="flex flex-1 min-h-0 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
            <section className="shrink-0 space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('teams.management.form.teamDetails')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="team-name">
                    {t('teams.management.form.name')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="team-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('teams.management.form.namePlaceholder')}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="team-territory">{t('teams.management.form.territory')}</Label>
                  <Select
                    value={territoryId || 'none'}
                    onValueChange={(v) => setTerritoryId(v === 'none' ? '' : v)}
                    disabled={territoriesQuery.isLoading}
                  >
                    <SelectTrigger id="team-territory">
                      <SelectValue
                        placeholder={
                          territoriesQuery.isLoading
                            ? t('teams.management.form.territoryPlaceholder')
                            : t('teams.management.form.territorySelect')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t('teams.management.form.none')}</SelectItem>
                      {territoryOptions.map((territory) => (
                        <SelectItem key={territory.id} value={String(territory.id)}>
                          {territory.name ?? `Territory ${territory.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {isEdit ? (
              <section className="flex min-h-0 flex-1 flex-col gap-3 border-t pt-4">
                <div className="flex shrink-0 items-center justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t('teams.management.form.members')}
                    {memberIds.size > 0 ? (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs align-middle">
                        {memberIds.size}
                      </Badge>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder={t('teams.management.form.searchMembers')}
                      className="h-9 pl-9"
                      aria-label={t('teams.management.form.filterMembersAria')}
                    />
                  </div>
                  <Popover open={addPopoverOpen} onOpenChange={setAddPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'gap-2',
                        )}
                      >
                        <UserPlus className="size-4" />
                        {t('teams.management.form.addMember')}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0" align="end">
                      <Command>
                        <CommandInput placeholder={t('teams.management.form.searchUsers')} />
                        <CommandEmpty>
                          {allUsersQuery.isLoading ? t('teams.management.form.loading') : t('teams.management.form.noUsersFound')}
                        </CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {availableToAdd.map((user) => (
                            <CommandItem
                              key={user.id}
                              onSelect={() => addMember(user.id)}
                              className="flex items-center gap-2"
                            >
                              <Avatar className="size-6">
                                {user.photo ? (
                                  <AvatarImage src={user.photo} alt={user.name} />
                                ) : (
                                  <AvatarFallback className="text-[10px]">
                                    {user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm truncate">{user.name}</span>
                                <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {canManageUsers && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => setUserModalOpen(true)}
                    >
                      <Plus className="size-4" />
                      {t('teams.management.form.newUser')}
                    </Button>
                  )}
                </div>

                <p className="shrink-0 text-sm text-muted-foreground">
                  {t('teams.management.grid.memberCount', { count: filteredMembers.length, total: memberIds.size })}
                  {memberSearch.trim() ? t('teams.management.grid.matchingFilter') : ''}
                  {hasMemberChanges && (
                    <span className="ml-2 font-medium text-amber-600">{t('teams.management.grid.unsavedChanges')}</span>
                  )}
                </p>

                <div
                  className={cn(
                    'min-h-0 overflow-auto rounded-lg border',
                    MEMBERS_TABLE_HEIGHT_CLASS,
                  )}
                >
                  <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                      <TableRow>
                        <TableHead>{t('teams.management.form.tableUser')}</TableHead>
                        <TableHead>{t('teams.management.form.tableEmail')}</TableHead>
                        <TableHead>{t('teams.management.form.tableRole')}</TableHead>
                        <TableHead>{t('teams.management.form.tableStatus')}</TableHead>
                        <TableHead className="text-right w-[88px]">{t('teams.management.form.tableActions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32">
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                              <Users className="size-8 mb-2 opacity-40" />
                              <p className="text-sm">{t('teams.management.form.emptyTitle')}</p>
                              <p className="text-xs">{t('teams.management.form.emptySubtitle')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32">
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground">
                              <Search className="size-8 mb-2 opacity-40" />
                              <p className="text-sm">{t('teams.management.form.filterEmptyTitle')}</p>
                              <p className="text-xs">{t('teams.management.form.filterEmptySubtitle')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((user) => {
                          const isNew = !originalMemberIds.has(user.id);
                          const statusKey = USER_STATUS_BY_API[user.status] ?? 'inactive';
                          const statusConfig = USER_STATUS_CONFIG[statusKey];

                          return (
                            <TableRow key={user.id} className="align-top">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-9 shrink-0 ring-1 ring-border">
                                    {user.photo ? (
                                      <AvatarImage src={user.photo} alt={user.name} />
                                    ) : (
                                      <AvatarFallback className="text-xs">
                                        {memberInitials(user.name)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">{user.name}</span>
                                      {isNew && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] h-4 px-1 border-emerald-300 text-emerald-700 bg-emerald-50"
                                        >
                                          {t('teams.management.form.newBadge')}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{user.email}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(user.roles ?? []).length > 0 ? (
                                    user.roles!.map((role) => (
                                      <Badge
                                        key={role}
                                        variant="secondary"
                                        className="bg-primary/5 text-primary"
                                      >
                                        {t(USER_ROLE_LABEL_KEY[role as UserRole] ?? role)}
                                      </Badge>
                                    ))
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={statusConfig.badge}>
                                  <span
                                    className={cn('mr-1.5 inline-block size-1.5 rounded-full', statusConfig.indicator)}
                                    aria-hidden
                                  />
                                  {statusConfig.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeMember(user.id)}
                                                  aria-label={t('teams.management.form.removeAria', { name: user.name })}
                                >
                                  <UserMinus className="size-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            ) : null}
          </div>
        )}

        <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('teams.management.form.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoadingTeam || isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {isEdit ? t('teams.management.form.saveChanges') : t('teams.management.form.createTeam')}
          </Button>
        </DialogFooter>
        {isEdit && teamIdNum > 0 && canManageUsers ? (
          <UserFormModal
            open={userModalOpen}
            onOpenChange={setUserModalOpen}
            mode="create"
            userId={null}
            defaultTeamIds={defaultTeamIdsForNewUser}
            onSuccess={() => void handleUserCreated()}
          />
        ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
