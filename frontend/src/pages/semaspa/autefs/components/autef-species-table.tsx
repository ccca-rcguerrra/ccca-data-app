import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Download } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import type { AutefVolumeBalanceSortField } from '@/types/semaspa';

import { formatExcess, formatVolume } from '../utils/format';
import type { AutefDetailController } from '../hooks/use-autef-detail-controller';

import { VolumeBalanceGauge } from './volume-balance-gauge';
import { AutefCreditInspector } from './autef-credit-inspector';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
const COL_COUNT = 6;

interface Props {
  controller: AutefDetailController;
}

function SortHeader({
  label,
  field,
  activeField,
  order,
  align = 'left',
  onSort,
}: {
  label: string;
  field: AutefVolumeBalanceSortField;
  activeField: AutefVolumeBalanceSortField;
  order: 'ASC' | 'DESC';
  align?: 'left' | 'right';
  onSort: (field: AutefVolumeBalanceSortField) => void;
}) {
  const active = activeField === field;
  const Icon = active && order === 'ASC' ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === 'right' ? 'text-right' : undefined}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1 font-medium hover:text-foreground',
          align === 'right' && 'justify-end w-full',
          active ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        <Icon className={cn('h-3.5 w-3.5', active ? 'opacity-100' : 'opacity-40')} />
      </button>
    </TableHead>
  );
}

export function AutefSpeciesTable({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: {
      mergedSpeciesRows,
      isLoadingSpecies,
      volumeBalances,
      speciesProductsMap,
      isExportingCredit,
      creditExportError,
      contributions,
      isLoadingContributions,
    },
    store: { state },
    handlers: {
      handleTabPageChange,
      handleTabPageSizeChange,
      handleSelectSpeciesProduct,
      handleCreditSort,
      handleExportCredit,
      handleOpenForestGuide,
    },
  } = controller;

  const tab = state.tabs.species;
  const total = volumeBalances.total;
  const totalPages = Math.max(1, Math.ceil(total / tab.pageSize) || 1);
  const selectedRow =
    mergedSpeciesRows.find(
      (row) => row.speciesProductId === state.selectedSpeciesProductId,
    ) ?? null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-3 pb-2 flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground max-w-3xl leading-relaxed">
          {t('semaspa.autefs.species.ruleHint')}
        </p>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => void handleExportCredit()}
            disabled={isExportingCredit || isLoadingSpecies}
          >
            <Download className="h-4 w-4" />
            {isExportingCredit
              ? t('semaspa.autefs.species.exporting')
              : t('semaspa.autefs.species.export')}
          </Button>
          {creditExportError ? (
            <p className="text-xs text-status-over" role="alert">
              {t('semaspa.autefs.species.exportFailed')}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto">
          <div className="overflow-hidden rounded-lg border border-border m-4 mt-1">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>{t('semaspa.autefs.species.species')}</TableHead>
                  <TableHead>{t('semaspa.autefs.species.product')}</TableHead>
                  <TableHead className="text-right">
                    {t('semaspa.autefs.species.authorized')}
                  </TableHead>
                  <TableHead className="text-right">{t('semaspa.autefs.species.moved')}</TableHead>
                  <SortHeader
                    label={t('semaspa.autefs.species.excess')}
                    field="excessVolume"
                    activeField={state.creditSortBy}
                    order={state.creditSortOrder}
                    align="right"
                    onSort={handleCreditSort}
                  />
                  <SortHeader
                    label={t('semaspa.autefs.species.ratioPercent')}
                    field="movedRatio"
                    activeField={state.creditSortBy}
                    order={state.creditSortOrder}
                    onSort={handleCreditSort}
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingSpecies && mergedSpeciesRows.length === 0
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: COL_COUNT }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : null}

                {!isLoadingSpecies && mergedSpeciesRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COL_COUNT} className="h-24 text-center text-muted-foreground">
                      {t('semaspa.autefs.species.noResults')}
                    </TableCell>
                  </TableRow>
                ) : null}

                {mergedSpeciesRows.map((row) => {
                  const product = speciesProductsMap[row.speciesProductId];
                  const balance = row.balance;
                  const selected = state.selectedSpeciesProductId === row.speciesProductId;

                  return (
                    <TableRow
                      key={row.key}
                      className="cursor-pointer hover:bg-muted/50"
                      aria-selected={selected}
                      data-state={selected ? 'selected' : undefined}
                      onClick={() => handleSelectSpeciesProduct(row.speciesProductId)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{product?.commonName ?? '—'}</span>
                          <span className="text-xs italic text-muted-foreground">
                            {product?.scientificName ?? '—'}
                          </span>
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
                      <TableCell>{product?.productName ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVolume(
                          balance?.authorizedVolume ?? null,
                          balance?.authorizedUnit ?? null,
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatVolume(balance?.movedVolume ?? null, balance?.movedUnit ?? null)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatExcess(balance?.excessVolume ?? null)}
                      </TableCell>
                      <TableCell>
                        <VolumeBalanceGauge ratio={balance?.movedRatio ?? null} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <aside className="lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-border overflow-auto max-h-64 lg:max-h-none">
          <AutefCreditInspector
            row={selectedRow}
            product={
              selectedRow ? speciesProductsMap[selectedRow.speciesProductId] : undefined
            }
            contributions={contributions.data}
            contributionsTotal={contributions.total}
            movedVolumeSum={contributions.movedVolumeSum}
            crossingForestGuideId={contributions.crossingForestGuideId}
            isLoadingContributions={isLoadingContributions}
            onOpenForestGuide={handleOpenForestGuide}
          />
        </aside>
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
