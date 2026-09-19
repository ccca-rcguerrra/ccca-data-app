import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/constants/routes.constants';
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import { ForestGuideStatusBadge } from '../../forest-guides/components/forest-guide-status-badge';
import type { PersonDetailController } from '../hooks/use-person-detail-controller';
import { personRoleI18nKey } from '../utils/role-label';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const COL_COUNT = 5;

export function PersonForestGuidesTable({ controller }: { controller: PersonDetailController }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    api: { forestGuides, isLoadingForestGuides },
    store: { state, actions },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.forestGuides;
  const rows = forestGuides.data;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {state.forestGuideFlag ? (
        <div className="px-4 pt-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {t(`semaspa.people.occurrences.flags.${state.forestGuideFlag}`)}
          </span>
          <button
            type="button"
            className="text-xs underline text-muted-foreground hover:text-foreground"
            onClick={actions.clearForestGuideFlag}
          >
            {t('semaspa.people.occurrences.clearFilter')}
          </button>
        </div>
      ) : null}
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.people.forestGuides.number')}</TableHead>
                <TableHead>{t('semaspa.people.forestGuides.type')}</TableHead>
                <TableHead>{t('semaspa.people.forestGuides.status')}</TableHead>
                <TableHead>{t('semaspa.people.forestGuides.issuedAt')}</TableHead>
                <TableHead>{t('semaspa.people.forestGuides.role')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingForestGuides && rows.length === 0
                ? Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: COL_COUNT }).map((__, cell) => (
                        <TableCell key={cell}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!isLoadingForestGuides && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.people.forestGuides.empty')}
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => {
                const roleKey = personRoleI18nKey(row.role);
                return (
                  <TableRow
                    key={`${row.forestGuide.id}-${row.role}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate(
                        ROUTES.semaspa.forestGuideDetail.replace(
                          ':id',
                          String(row.forestGuide.id),
                        ),
                      )
                    }
                  >
                    <TableCell className="font-mono text-[13px] font-medium">
                      {row.forestGuide.number ?? row.forestGuide.id}
                    </TableCell>
                    <TableCell>{row.forestGuide.type ?? '—'}</TableCell>
                    <TableCell>
                      <ForestGuideStatusBadge status={row.forestGuide.status} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.forestGuide.issuedAt
                        ? formatISODateLocal(row.forestGuide.issuedAt) || EMPTY_DATE_LABEL
                        : EMPTY_DATE_LABEL}
                    </TableCell>
                    <TableCell>{roleKey ? t(roleKey) : row.role}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.people.list.totalRows', { count: forestGuides.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('forestGuides', size)}
        currentPage={forestGuides.page || tab.page}
        totalPages={Math.max(1, forestGuides.totalPages)}
        canPrev={forestGuides.hasPrev}
        canNext={forestGuides.hasNext}
        onPageChange={(page) => handleTabPageChange('forestGuides', page)}
        isBusy={isLoadingForestGuides}
      />
    </div>
  );
}
