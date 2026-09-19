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
import type { PersonDetailController } from '../hooks/use-person-detail-controller';
import { personRoleI18nKey } from '../utils/role-label';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const COL_COUNT = 4;

export function PersonAutefsTable({ controller }: { controller: PersonDetailController }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    api: { autefs, isLoadingAutefs },
    store: { state, actions },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.autefs;
  const rows = autefs.data;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {state.autefFlag ? (
        <div className="px-4 pt-4 flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {t(`semaspa.people.occurrences.flags.${state.autefFlag}`)}
          </span>
          <button
            type="button"
            className="text-xs underline text-muted-foreground hover:text-foreground"
            onClick={actions.clearAutefFlag}
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
                <TableHead>{t('semaspa.people.autefs.number')}</TableHead>
                <TableHead>{t('semaspa.people.autefs.city')}</TableHead>
                <TableHead>{t('semaspa.people.autefs.issuedAt')}</TableHead>
                <TableHead>{t('semaspa.people.autefs.role')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAutefs && rows.length === 0
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
              {!isLoadingAutefs && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.people.autefs.empty')}
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => {
                const roleKey = personRoleI18nKey(row.role);
                return (
                  <TableRow
                    key={`${row.autef.id}-${row.role}`}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate(ROUTES.semaspa.autefDetail.replace(':id', String(row.autef.id)))
                    }
                  >
                    <TableCell className="font-mono text-[13px] font-medium">
                      {row.autef.number ?? row.autef.id}
                    </TableCell>
                    <TableCell>{row.autef.city ?? '—'}</TableCell>
                    <TableCell className="tabular-nums">
                      {row.autef.issuedAt
                        ? formatISODateLocal(row.autef.issuedAt) || EMPTY_DATE_LABEL
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
        leftContent={t('semaspa.people.list.totalRows', { count: autefs.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('autefs', size)}
        currentPage={autefs.page || tab.page}
        totalPages={Math.max(1, autefs.totalPages)}
        canPrev={autefs.hasPrev}
        canNext={autefs.hasNext}
        onPageChange={(page) => handleTabPageChange('autefs', page)}
        isBusy={isLoadingAutefs}
      />
    </div>
  );
}
