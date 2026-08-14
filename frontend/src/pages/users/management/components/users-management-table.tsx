import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Info,
  UserMinus,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/shadcn/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';

import { USER_STATUS_CONFIG, USER_ROLE_LABEL, USER_ROLE_LABEL_KEY, formatAge, formatRelativeDate } from '../types';
import type { UsersManagementController } from '../hooks/use-users-management-controller';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { RolePermissionsTooltip, RolesColumnHeaderHint } from './user-role-permissions-info';
import type { UserRole } from '@/types/users';

interface UsersManagementTableProps {
  controller: UsersManagementController;
}

/**
 * UsersManagementTable
 * Same layout as AlertsManagementTable: header (title, badge, filters, actions), scrollable table, pagination footer.
 */
export function UsersManagementTable({ controller }: UsersManagementTableProps) {
  const { t } = useTranslation();
  const {
    api: {
      paginatedUsers,
      pagination,
      isLoading,
      shouldUseApiPagination,
      totalPages,
      isRemoving,
    },
    store: { state, actions },
    handlers: {
      handleUserHover,
      handlePageSizeChange,
      openUserModalEdit,
      removeUser,
    },
  } = controller;

  const handlePageChange = (page: number) => actions.setPage(page);

  const { can } = usePermissions();
  const canManageUsers = can(PERMISSIONS.USERS_MANAGE);

  const [userToRemove, setUserToRemove] = useState<{ id: number; name: string } | null>(null);

  const currentPage = shouldUseApiPagination && pagination ? pagination.page : state.currentPage;
  const hasPrev =
    shouldUseApiPagination && pagination ? pagination.hasPrev : state.currentPage > 1;
  const hasNext =
    shouldUseApiPagination && pagination
      ? pagination.hasNext
      : state.currentPage < totalPages;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Table - scrollable area with border like alerts */}
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border m-4 border-[var(--color-neutral-300)]">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('users.management.table.user')}</TableHead>
                <TableHead>{t('users.management.table.email')}</TableHead>
                <TableHead>{t('users.management.table.institution')}</TableHead>
                <TableHead>
                  <RolesColumnHeaderHint />
                </TableHead>
                <TableHead>{t('users.management.table.teams')}</TableHead>
                <TableHead>{t('users.management.table.status')}</TableHead>
                <TableHead className="text-right">{t('users.management.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && paginatedUsers.length === 0 ? (
                Array.from({ length: 10 }).map((_, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <Skeleton className="size-10 rounded-full shrink-0" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-14 rounded-md" />
                        <Skeleton className="h-5 w-12 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 rounded ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const statusConfig = USER_STATUS_CONFIG[user.status];
                  const visibleTeams = user.teams.slice(0, 2);
                  const hiddenCount = user.teams.length - visibleTeams.length;

                  return (
                    <TableRow
                      key={user.id}
                      className={cn('align-top', canManageUsers && 'cursor-pointer')}
                      onClick={() => canManageUsers && openUserModalEdit(Number(user.id))}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <Avatar className="size-10 ring-1 ring-[var(--color-neutral-300)]">
                            {user.avatar ? (
                              <AvatarImage src={user.avatar} alt={user.name} />
                            ) : (
                              <AvatarFallback>
                                {user.name
                                  .split(' ')
                                  .map((part) => part[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium leading-none">{user.name}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    className="inline-flex shrink-0 rounded-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-800)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    aria-label={t('users.management.table.viewJoinDate')}
                                  >
                                    <Info className="size-4" aria-hidden />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('users.management.table.joined')}{formatRelativeDate(user.createdAt)}
                                </TooltipContent>
                              </Tooltip>
                              {user.hasFullAccess && (
                                <Badge
                                  variant="outline"
                                  className="gap-1 border-orange-200 bg-orange-50 text-orange-700"
                                >
                                  {t('users.management.table.fullBiomeAccess')}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-[var(--color-neutral-600)]">
                              {t('users.management.table.lastLogin')}{formatAge(user.lastLogin, t)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{user.email}</TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{user.institution}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span key={role} className="inline-flex items-center gap-0.5">
                                <Badge variant="secondary" className="bg-primary/5 text-primary">
                                  {t(USER_ROLE_LABEL_KEY[role as UserRole] ?? role)}
                                </Badge>
                                <RolePermissionsTooltip role={role as UserRole} />
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {visibleTeams.map((team) => (
                            <Badge key={team} variant="outline">
                              {team}
                            </Badge>
                          ))}
                          {hiddenCount > 0 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-default">
                                  <Badge variant="outline">+{hiddenCount}</Badge>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{user.teams.slice(2).join(', ')}</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex size-2.5 rounded-full',
                              statusConfig.indicator
                            )}
                          />
                          <Badge
                            variant="outline"
                            className={cn(
                              'border text-xs',
                              statusConfig.badge,
                              user.status === 'blocked' && 'border-red-500 text-red-700'
                            )}
                          >
                            {t(statusConfig.labelKey)}
                          </Badge>
                        </div>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={t('users.management.table.editUser')}
                              onClick={() => {
                                handleUserHover(user.id);
                                openUserModalEdit(Number(user.id));
                              }}
                            >
                              <Edit className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={t('users.management.table.removeAccess')}
                              onClick={() => setUserToRemove({ id: Number(user.id), name: user.name })}
                              disabled={isRemoving || user.status === 'blocked'}
                            >
                              <UserMinus className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-[var(--color-neutral-600)]">
                    {controller.api.users.length === 0
                      ? t('users.management.table.empty')
                      : t('users.management.table.emptyFiltered')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ListPaginationFooter
        leftContent={null}
        pageSize={state.pageSize}
        pageSizeOptions={[10, 25, 50]}
        onPageSizeChange={handlePageSizeChange}
        currentPage={currentPage}
        totalPages={totalPages}
        canPrev={hasPrev}
        canNext={hasNext}
        onPageChange={handlePageChange}
        isBusy={isLoading}
        borderClassName="border-[var(--color-neutral-300)]"
        textClassName="text-foreground"
      />

      <Dialog open={Boolean(userToRemove)} onOpenChange={() => setUserToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.management.table.removeDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('users.management.table.removeDialogDescription', { name: userToRemove?.name ?? '' })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUserToRemove(null)} disabled={isRemoving}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (userToRemove) {
                  removeUser(userToRemove.id).finally(() => setUserToRemove(null));
                }
              }}
              disabled={isRemoving}
            >
              {isRemoving ? t('users.management.table.removing') : t('users.management.table.removeAccess')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
