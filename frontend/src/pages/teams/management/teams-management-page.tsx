import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Plus, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useLocaleFormat } from '@/hooks/use-locale-format';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { TeamFormModal } from './components/team-form-modal';
import { TeamsManagementGrid } from './components/teams-management-grid';
import { useTeamsManagementController } from './hooks/use-teams-management-controller';
import { Input } from '@/components/ui/shadcn/input';
import type { TeamsManagementController } from './hooks/use-teams-management-controller';

const SEARCH_DEBOUNCE_MS = 350;

/**
 * Page header: title, subtitle, search, clear, New team, refresh.
 */
function TeamsManagementPageHeader({
  controller,
}: {
  controller: TeamsManagementController;
}) {
  const { t } = useTranslation();
  const {
    api: { pagination, isLoading, refetch },
    store: { state },
    handlers: { handleSearchQueryChange, handleClearFilters, openTeamModalCreate },
  } = controller;

  const { can } = usePermissions();
  const { formatNumber } = useLocaleFormat();
  const canManageTeams = can(PERMISSIONS.TEAMS_MANAGE);

  const [searchValue, setSearchValue] = useState(state.searchQuery);
  useEffect(() => {
    const t = setTimeout(() => handleSearchQueryChange(searchValue), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchValue, handleSearchQueryChange]);
  useEffect(() => {
    setSearchValue(state.searchQuery);
  }, [state.searchQuery]);

  const hasActiveFilters = state.filters.status !== 'all';

  return (
    <div className="p-6 pb-4 shrink-0 border-b border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {t('teams.management.title')}
            </h2>
            {pagination && (
              <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t('teams.management.title')} ({formatNumber(pagination.total)})
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-normal leading-relaxed mt-0.5">
            {t('teams.management.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-[220px] min-w-[180px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('teams.management.filters.searchPlaceholder')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-9"
              disabled={isLoading}
            />
          </div>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="h-9" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
              {t('teams.management.filters.clear')}
            </Button>
          )}

          {canManageTeams && (
            <Button variant="default" size="sm" className="h-9 gap-2" onClick={openTeamModalCreate}>
              <Plus className="h-4 w-4" />
              {t('teams.management.filters.newTeam')}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label={t('teams.management.filters.refresh')}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * TeamsManagementPage
 * Same layout as AlertsManagementPage / UsersManagementPage: full height, error/loading, header + table.
 */
export function TeamsManagementPage() {
  const { t } = useTranslation();
  const controller = useTeamsManagementController();

  if (controller.api.isError) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-error-500)] bg-[var(--color-error-bg)] p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-[var(--color-error-500)] shrink-0" />
          <h2 className="text-base font-bold text-[var(--color-error-500)]">
            {t('teams.management.errors.title')}
          </h2>
          <p className="text-sm text-center text-foreground">
            {controller.api.error instanceof Error
              ? controller.api.error.message
              : t('teams.management.errors.message')}
          </p>
        </div>
      </div>
    );
  }

  const { store } = controller;

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <TeamsManagementPageHeader controller={controller} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <TeamsManagementGrid controller={controller} />
      </div>
      <TeamFormModal
        open={store.state.teamModalOpen}
        onOpenChange={(open) => {
          if (!open) store.actions.closeTeamModal();
        }}
        mode={store.state.teamModalMode ?? 'create'}
        teamId={store.state.teamModalTeamId}
        onSuccess={() => store.actions.closeTeamModal()}
      />
    </div>
  );
}

/** Backward compatibility alias */
export const TeamsListPage = TeamsManagementPage;
