import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/shadcn/badge';
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
import {
  formatSpeciesProductLabel,
  formatVolume,
} from '../utils/format';
import { VolumeBalanceGauge } from './volume-balance-gauge';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface Props {
  controller: AutefDetailController;
}

export function AutefSpeciesTable({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: {
      mergedSpeciesRows,
      isLoadingSpecies,
      species,
      volumeBalances,
      speciesProductsMap,
    },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;

  const tab = state.tabs.species;
  const total = Math.max(species.total, volumeBalances.total);
  const totalPages = Math.max(1, Math.ceil(total / tab.pageSize) || 1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="overflow-hidden rounded-lg border border-border m-4">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead>{t('semaspa.autefs.species.scientificName')}</TableHead>
                <TableHead>{t('semaspa.autefs.species.commonName')}</TableHead>
                <TableHead className="text-right">{t('semaspa.autefs.species.volume')}</TableHead>
                <TableHead className="text-right">{t('semaspa.autefs.species.authorized')}</TableHead>
                <TableHead className="text-right">{t('semaspa.autefs.species.moved')}</TableHead>
                <TableHead className="w-[180px]">{t('semaspa.autefs.species.progress')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingSpecies && mergedSpeciesRows.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!isLoadingSpecies && mergedSpeciesRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.autefs.species.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}

              {mergedSpeciesRows.map((row) => {
                const product = speciesProductsMap[row.speciesProductId];
                const balance = row.balance;
                const ratio = balance?.movedRatio ?? null;

                return (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-1">
                        <span className="italic">{product?.scientificName ?? '—'}</span>
                        <div className="flex flex-wrap gap-1">
                          {balance?.isOverExtracted ? (
                            <Badge variant="destructive">
                              {t('semaspa.autefs.volumeBalances.overExtracted')}
                            </Badge>
                          ) : null}
                          {balance?.hasUnitConflict ? (
                            <Badge variant="outline">
                              {t('semaspa.autefs.volumeBalances.unitConflict')}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{product?.commonName ?? '—'}</span>
                        <span className="text-xs text-muted-foreground">
                          {product?.productName ??
                            formatSpeciesProductLabel(product, row.speciesProductId)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVolume(row.original?.volume ?? null, row.original?.unit ?? null)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVolume(
                        balance?.authorizedVolume ?? null,
                        balance?.authorizedUnit ?? null,
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVolume(balance?.movedVolume ?? null, balance?.movedUnit ?? null)}
                    </TableCell>
                    <TableCell>
                      <VolumeBalanceGauge ratio={ratio} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.autefs.list.totalRows', { count: total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('species', size)}
        currentPage={tab.page}
        totalPages={totalPages}
        canPrev={tab.page > 1}
        canNext={tab.page < totalPages}
        onPageChange={(page) => handleTabPageChange('species', page)}
        isBusy={isLoadingSpecies}
      />
    </div>
  );
}
