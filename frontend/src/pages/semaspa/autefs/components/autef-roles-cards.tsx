import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';

import { Badge } from '@/components/ui/shadcn/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import type { PersonRole } from '@/types/semaspa';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';
import { formatPersonLabel } from '../utils/format';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

const ROLE_GROUPS = [
  { key: 'PROPRIETARIO', labelKey: 'semaspa.autefs.roles.owner' },
  { key: 'ANALISTA', labelKey: 'semaspa.autefs.roles.analyst' },
  { key: 'RESPONSAVEL_TECNICO', labelKey: 'semaspa.autefs.roles.technicalResponsible' },
] as const;

interface Props {
  controller: AutefDetailController;
}

export function AutefRolesCards({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: { roles, isLoadingRoles, peopleMap },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;

  const tab = state.tabs.roles;
  const rows = roles.data;

  const grouped = useMemo(() => {
    const known = new Set<string>(ROLE_GROUPS.map((g) => g.key));
    const map: Record<string, PersonRole[]> = {
      PROPRIETARIO: [],
      ANALISTA: [],
      RESPONSAVEL_TECNICO: [],
      OTHER: [],
    };

    for (const role of rows) {
      if (known.has(role.role)) {
        map[role.role]!.push(role);
      } else {
        map.OTHER!.push(role);
      }
    }
    return map;
  }, [rows]);

  if (isLoadingRoles && rows.length === 0) {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (!isLoadingRoles && rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-6">
        {t('semaspa.autefs.roles.noResults')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLE_GROUPS.map((group) => (
            <Card key={group.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t(group.labelKey)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(grouped[group.key] ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  (grouped[group.key] ?? []).map((role) => {
                    const person = peopleMap[role.personId];
                    return (
                      <div key={role.id} className="space-y-1 border-b border-border pb-2 last:border-0">
                        <p className="text-sm font-medium">
                          {formatPersonLabel(person, role.personId)}
                        </p>
                        {person?.taxId ? (
                          <p className="text-xs text-muted-foreground">
                            {t('semaspa.autefs.roles.taxId')}: {person.taxId}
                          </p>
                        ) : null}
                        <Badge variant="outline" className="text-xs">
                          {role.source}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(grouped.OTHER ?? []).length > 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {t('semaspa.autefs.roles.other')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(grouped.OTHER ?? []).map((role) => {
                const person = peopleMap[role.personId];
                return (
                  <div
                    key={role.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatPersonLabel(person, role.personId)}
                      </p>
                      <p className="text-xs text-muted-foreground">{role.role}</p>
                    </div>
                    <Badge variant="outline">{role.source}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <ListPaginationFooter
        leftContent={t('semaspa.autefs.list.totalRows', { count: roles.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('roles', size)}
        currentPage={roles.page || tab.page}
        totalPages={Math.max(1, roles.totalPages)}
        canPrev={roles.hasPrev}
        canNext={roles.hasNext}
        onPageChange={(page) => handleTabPageChange('roles', page)}
        isBusy={isLoadingRoles}
      />
    </div>
  );
}
