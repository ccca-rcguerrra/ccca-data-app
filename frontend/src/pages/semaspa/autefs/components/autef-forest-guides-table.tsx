import { useTranslation } from 'react-i18next';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
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
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';
import { ForestGuideDetailSheet } from '../../forest-guides/components/forest-guide-detail-sheet';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Props {
  controller: AutefDetailController;
}

export function AutefForestGuidesTable({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: { forestGuides, isLoadingForestGuides },
    store: { state },
    handlers: {
      handleTabPageChange,
      handleTabPageSizeChange,
      handleOpenForestGuide,
      handleForestGuideSheetOpenChange,
    },
  } = controller;

  const tab = state.tabs.forestGuides;
  const rows = forestGuides.data;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border m-4 border-[var(--color-neutral-300)]">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.autefs.forestGuides.number')}</TableHead>
                <TableHead>{t('semaspa.autefs.forestGuides.status')}</TableHead>
                <TableHead>{t('semaspa.autefs.forestGuides.type')}</TableHead>
                <TableHead>{t('semaspa.autefs.forestGuides.issuedAt')}</TableHead>
                <TableHead>{t('semaspa.autefs.forestGuides.plates')}</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingForestGuides && rows.length === 0
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}
              {!isLoadingForestGuides && rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.autefs.forestGuides.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.number ?? '—'}</TableCell>
                  <TableCell>{row.status ?? '—'}</TableCell>
                  <TableCell>{row.type ?? '—'}</TableCell>
                  <TableCell>
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                  <TableCell>
                    {row.vehiclePlates?.length ? row.vehiclePlates.join(', ') : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenForestGuide(row.id)}
                    >
                      <Eye className="h-4 w-4" />
                      {t('semaspa.autefs.forestGuides.view')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.autefs.list.totalRows', { count: forestGuides.total })}
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

      <ForestGuideDetailSheet
        forestGuideId={state.selectedForestGuideId}
        open={state.forestGuideSheetOpen}
        onOpenChange={handleForestGuideSheetOpenChange}
      />
    </div>
  );
}
