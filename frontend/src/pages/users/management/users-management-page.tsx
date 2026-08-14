import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { AlertCircle, ChevronDown, Filter, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { UserFormModal } from './components/user-form-modal';
import { UsersManagementTable } from './components/users-management-table';
import { useUsersManagementController } from './hooks/use-users-management-controller';
import { Input } from '@/components/ui/shadcn/input';
import { cn } from '@/lib/utils';
import type { UsersManagementController } from './hooks/use-users-management-controller';

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Page header: title, subtitle, search, team filter, clear, New User, refresh.
 */
function UsersManagementPageHeader({
  controller,
}: {
  controller: UsersManagementController;
}) {
  const {
    api: { pagination, isLoading, refetch, teamNamesOptions, selectedTeamNames },
    store: { state },
    handlers: {
      handleSearchQueryChange,
      handleTeamFilterChange,
      handleClearFilters,
      openUserModalCreate,
    },
  } = controller;

  const { t } = useTranslation();
  const { can } = usePermissions();
  const canManageUsers = can(PERMISSIONS.USERS_MANAGE);

  const [searchValue, setSearchValue] = useState(state.searchQuery);
  useEffect(() => {
    const t = setTimeout(() => handleSearchQueryChange(searchValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchValue, handleSearchQueryChange]);
  useEffect(() => {
    setSearchValue(state.searchQuery);
  }, [state.searchQuery]);

  const hasActiveFilters = selectedTeamNames.length > 0;

  return (
    <div className="p-6 pb-4 shrink-0 border-b border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('users.management.title')}
            </h2>
            {pagination && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t('users.management.total', { count: pagination.total })}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed mt-0.5">
            {t('users.management.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-[220px] min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('users.management.filters.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-9"
              disabled={isLoading}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                'h-9 w-[140px] justify-between'
              )}
            >
                <Filter className="h-4 w-4 mr-2" />
                <span className="truncate">
                  {selectedTeamNames.length === 0
                    ? t('users.management.filters.team')
                    : t('users.management.filters.selected', { count: selectedTeamNames.length })}
                </span>
                <ChevronDown className="h-4 w-4 ml-1 shrink-0 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-y-auto">
              {teamNamesOptions.map((name) => (
                <DropdownMenuCheckboxItem
                  key={name}
                  checked={selectedTeamNames.includes(name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleTeamFilterChange([...selectedTeamNames, name]);
                    } else {
                      handleTeamFilterChange(selectedTeamNames.filter((n) => n !== name));
                    }
                  }}
                >
                  {name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
              {t('users.management.filters.clear')}
            </Button>
          )}

          {canManageUsers && (
            <Button variant="default" size="sm" className="h-9 gap-2" onClick={openUserModalCreate}>
              <Plus className="h-4 w-4" />
              {t('users.management.filters.newUser')}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label={t('users.management.filters.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * UsersManagementPage
 * Same layout as AlertsManagementPage: full height, error/loading states, header + table.
 * Business logic is in use-users-management-controller and store.
 */
export function UsersManagementPage() {
  const { t } = useTranslation();
  const controller = useUsersManagementController();

  if (controller.api.isError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-error-500)] bg-[var(--color-error-bg)] p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-[var(--color-error-500)] shrink-0" />
          <h2 className="text-base font-bold text-[var(--color-error-500)]">
            {t('users.management.errors.title')}
          </h2>
          <p className="text-sm text-center text-foreground">
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('users.management.errors.message')}
          </p>
        </div>
      </div>
    );
  }

  const { store } = controller;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <UsersManagementPageHeader controller={controller} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <UsersManagementTable controller={controller} />
      </div>
      <UserFormModal
        open={store.state.userModalOpen}
        onOpenChange={(open) => {
          if (!open) store.actions.closeUserModal();
        }}
        mode={store.state.userModalMode ?? 'create'}
        userId={store.state.userModalUserId}
        onSuccess={() => store.actions.closeUserModal()}
      />
    </div>
  );
}
