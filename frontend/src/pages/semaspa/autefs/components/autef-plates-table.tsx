import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/constants/routes.constants';
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
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const COL_COUNT = 2;

interface Props {
  controller: AutefDetailController;
}

export function AutefPlatesTable({ controller }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    api: { plates, isLoadingPlates },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.plates;
  const rows = plates.data;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.autefs.plates.plate')}</TableHead>
                <TableHead className="text-right">
                  {t('semaspa.autefs.plates.distinctGfCount')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingPlates && rows.length === 0
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
              {!isLoadingPlates && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.autefs.plates.empty')}
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => (
                <TableRow
                  key={row.plate}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    navigate(
                      `${ROUTES.semaspa.forestGuides}?plate=${encodeURIComponent(row.plate)}`,
                    )
                  }
                >
                  <TableCell className="font-mono text-[13px] font-medium">{row.plate}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.distinctGfCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.autefs.list.totalRows', { count: plates.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('plates', size)}
        currentPage={plates.page || tab.page}
        totalPages={Math.max(1, plates.totalPages)}
        canPrev={plates.hasPrev}
        canNext={plates.hasNext}
        onPageChange={(page) => handleTabPageChange('plates', page)}
        isBusy={isLoadingPlates}
      />
    </div>
  );
}
