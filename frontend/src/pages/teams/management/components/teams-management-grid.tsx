import {
  BadgeAlert,
  Clock,
  Edit,
  MapPin,
  UserPlus,
  Users,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/use-permissions';
import { PERMISSIONS } from '@/constants/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/shadcn/avatar';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';

import { formatRelative } from '../types';
import type { TeamRowData } from '../types';
import type { TeamsManagementController } from '../hooks/use-teams-management-controller';

interface TeamsManagementGridProps {
  controller: TeamsManagementController;
}

function memberInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function TeamCardSkeleton() {
  return (
    <Card className="gap-4 py-4">
      <CardHeader className="px-4 pb-0">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="px-4 py-0">
        <Skeleton className="h-8 w-full" />
      </CardContent>
      <CardFooter className="px-4 pt-0 gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </CardFooter>
    </Card>
  );
}

interface TeamCardProps {
  team: TeamRowData;
  onEdit: (id: string) => void;
  onManageMembers: (id: string) => void;
  canManage: boolean;
}

function TeamCard({ team, onEdit, onManageMembers, canManage }: TeamCardProps) {
  const { t } = useTranslation();
  const isArchived = team.status === 'archived';
  const hasMembers = team.usersCount > 0;
  const visiblePreviews = team.memberPreviews.slice(0, 4);
  const overflowCount = Math.max(0, team.usersCount - visiblePreviews.length);

  return (
    <Card
      className={cn(
        'gap-4 py-4 shadow-sm transition hover:shadow-md hover:bg-muted/30',
        isArchived && 'opacity-60',
        canManage && 'cursor-pointer',
      )}
      onClick={() => canManage && onEdit(team.id)}
      onKeyDown={(e) => {
        if (!canManage) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit(team.id);
        }
      }}
      role={canManage ? 'button' : undefined}
      tabIndex={canManage ? 0 : undefined}
    >
      <CardHeader className="px-4 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2" title={team.name}>
            {team.name}
          </CardTitle>
          {isArchived && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {t('teams.management.grid.archived')}
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-start gap-1.5 text-sm">
          <MapPin className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
          <span className="line-clamp-2" title={team.territoryLabel}>
            {team.territoryLabel}
          </span>
        </CardDescription>
        {team.biomes.length > 1 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {team.biomes.map((biome) => (
              <Badge key={biome} variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                {biome}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 py-0">
        {hasMembers ? (
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {visiblePreviews.length > 0 ? (
                visiblePreviews.map((member) => (
                  <Avatar
                    key={member.id}
                    className="size-8 border-2 border-background"
                    title={member.name}
                  >
                    {member.photo ? (
                      <AvatarImage src={member.photo} alt={member.name} />
                    ) : (
                      <AvatarFallback className="text-[10px] bg-muted">
                        {memberInitials(member.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                ))
              ) : (
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted">
                  <Users className="size-4 text-muted-foreground" aria-hidden />
                </div>
              )}
              {overflowCount > 0 && (
                <div
                  className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground"
                  title={t('teams.management.grid.more', { count: overflowCount })}
                >
                  +{overflowCount}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {t('teams.management.grid.members', { count: team.usersCount })}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-amber-300/80 bg-amber-50/80 px-3 py-2 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-800/50">
            <BadgeAlert className="size-4 shrink-0" aria-hidden />
            <span className="text-sm font-medium">            {t('teams.management.grid.noMembers')}</span>
          </div>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {t('teams.management.grid.updated')}{formatRelative(team.lastUpdated)}
        </p>
      </CardContent>

      <CardFooter
        className="px-4 pt-0 flex gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5"
            onClick={() => onEdit(team.id)}
          >
            <Edit className="size-3.5" />
            {t('teams.management.grid.edit')}
          </Button>
        )}
        <Button
          variant={hasMembers ? 'secondary' : 'default'}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => onManageMembers(team.id)}
        >
          <UserPlus className="size-3.5" />
          {hasMembers ? t('teams.management.grid.members', { count: team.usersCount }) : t('teams.management.grid.addMembers')}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * TeamsManagementGrid
 * Card grid layout for organizational teams (territory + roster at a glance).
 */
export function TeamsManagementGrid({ controller }: TeamsManagementGridProps) {
  const { t } = useTranslation();
  const {
    api: { paginatedTeams, pagination, isLoading, shouldUseApiPagination, totalPages },
    store: { state, actions },
    handlers: { handlePageSizeChange, openTeamModalEdit },
  } = controller;

  const handlePageChange = (page: number) => actions.setPage(page);

  const { can } = usePermissions();
  const canManageTeams = can(PERMISSIONS.TEAMS_MANAGE);

  const currentPage = shouldUseApiPagination && pagination ? pagination.page : state.currentPage;
  const hasPrev =
    shouldUseApiPagination && pagination ? pagination.hasPrev : state.currentPage > 1;
  const hasNext =
    shouldUseApiPagination && pagination
      ? pagination.hasNext
      : state.currentPage < totalPages;

  const emptyMessage =
    controller.api.teams.length === 0
      ? t('teams.management.grid.empty')
      : t('teams.management.grid.emptyFiltered');

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        {isLoading && paginatedTeams.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        ) : paginatedTeams.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {paginatedTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onEdit={openTeamModalEdit}
                onManageMembers={openTeamModalEdit}
                canManage={canManageTeams}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-neutral-300)] py-16 text-center">
            <Users className="size-10 mb-3 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-[var(--color-neutral-600)]">{emptyMessage}</p>
          </div>
        )}
      </div>

      <ListPaginationFooter
        leftContent={null}
        pageSize={state.pageSize}
        pageSizeOptions={[12, 24, 48]}
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
    </div>
  );
}
