import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { LazyTabsContent } from '@/components/ui/lazy-tabs-content';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import { ROUTES } from '@/constants/routes.constants';
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import {
  formatPersonLabel,
  formatSpeciesProductLabel,
  formatVolume,
} from '../autefs/utils/format';
import {
  useForestGuideDetailController,
  type ForestGuideDetailController,
} from './hooks/use-forest-guide-detail-controller';
import { ForestGuideStatusBadge } from './components/forest-guide-status-badge';
import { PlateChip } from './components/plate-chip';
import { PersonLink } from '../people/components/person-link';
import { PermitReferencesList } from '../permit-references/components/permit-references-list';
import {
  hasBrokenPermitRef,
  PermitMatchStatusBadge,
} from '../permit-references/components/permit-match-status-badge';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatCurrency(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'BRL' }).format(value);
}

function DetailSummary({ controller }: { controller: ForestGuideDetailController }) {
  const { t } = useTranslation();
  const { forestGuide, isLoadingDetail, permitReferences } = controller.api;

  if (isLoadingDetail) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-7 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!forestGuide) return null;

  const title = forestGuide.number
    ? t('semaspa.forestGuides.detail.title', { number: forestGuide.number })
    : t('semaspa.forestGuides.detail.untitled', { id: forestGuide.id });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium uppercase tracking-[0.4px] text-muted-foreground">
          {t('semaspa.forestGuides.detail.eyebrow')}
        </p>
        <h2 className="mt-1 font-mono text-xl font-semibold tracking-tight">{title}</h2>
        {hasBrokenPermitRef(permitReferences.data.map((row) => row.matchStatus)) ? (
          <div className="mt-2">
            <PermitMatchStatusBadge
              status={
                permitReferences.data.some((row) => row.matchStatus === 'unparseable')
                  ? 'unparseable'
                  : 'unmatched'
              }
            />
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.status')}
          </p>
          <div className="mt-1">
            <ForestGuideStatusBadge status={forestGuide.status} />
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.type')}
          </p>
          <p className="font-medium">{forestGuide.type ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.issuedAt')}
          </p>
          <p className="font-medium tabular-nums">
            {forestGuide.issuedAt
              ? formatISODateLocal(forestGuide.issuedAt) || EMPTY_DATE_LABEL
              : EMPTY_DATE_LABEL}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.plates')}
          </p>
          <div className="mt-1">
            <PlateChip plates={forestGuide.vehiclePlates} />
          </div>
        </div>
        <div className="col-span-2 md:col-span-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.permits')}
          </p>
          <p className="font-mono text-[13px] font-medium">
            {forestGuide.permitRefs?.length ? forestGuide.permitRefs.join(', ') : '—'}
          </p>
        </div>
        <div className="col-span-2 md:col-span-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('semaspa.forestGuides.detail.permitMatch')}
          </p>
          <div className="mt-2">
            <PermitReferencesList
              rows={permitReferences.data}
              emptyLabel={t('semaspa.permitReferences.list.emptyNested')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpeciesTab({ controller }: { controller: ForestGuideDetailController }) {
  const { t } = useTranslation();
  const {
    api: { species, isLoadingSpecies, speciesProductsMap },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.species;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('semaspa.forestGuides.species.scientificName')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.species.commonName')}</TableHead>
                <TableHead className="text-right">{t('semaspa.forestGuides.species.volume')}</TableHead>
                <TableHead className="text-right">{t('semaspa.forestGuides.species.value')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoadingSpecies && species.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.forestGuides.species.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}
              {species.data.map((row) => {
                const product = speciesProductsMap[row.speciesProductId];
                return (
                  <TableRow key={row.id}>
                    <TableCell className="italic">
                      {product?.scientificName ??
                        formatSpeciesProductLabel(product, row.speciesProductId)}
                    </TableCell>
                    <TableCell>{product?.commonName ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatVolume(row.volume, row.unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(row.value)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.forestGuides.list.totalRows', { count: species.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('species', size)}
        currentPage={species.page || tab.page}
        totalPages={Math.max(1, species.totalPages)}
        canPrev={species.hasPrev}
        canNext={species.hasNext}
        onPageChange={(page) => handleTabPageChange('species', page)}
        isBusy={isLoadingSpecies}
      />
    </div>
  );
}

function RolesTab({ controller }: { controller: ForestGuideDetailController }) {
  const { t } = useTranslation();
  const {
    api: { roles, isLoadingRoles, peopleMap },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.roles;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('semaspa.forestGuides.roles.person')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.roles.role')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.roles.source')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoadingRoles && roles.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.forestGuides.roles.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}
              {roles.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <PersonLink personId={row.personId}>
                      {formatPersonLabel(peopleMap[row.personId], row.personId)}
                    </PersonLink>
                  </TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>{row.source}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.forestGuides.list.totalRows', { count: roles.total })}
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

function AutefsTab({ controller }: { controller: ForestGuideDetailController }) {
  const { t } = useTranslation();
  const {
    api: { autefs, isLoadingAutefs },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;
  const tab = state.tabs.autefs;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead>{t('semaspa.forestGuides.autefs.number')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.autefs.processNumber')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.autefs.city')}</TableHead>
                <TableHead>{t('semaspa.forestGuides.autefs.issuedAt')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoadingAutefs && autefs.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t('semaspa.forestGuides.autefs.noResults')}
                  </TableCell>
                </TableRow>
              ) : null}
              {autefs.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      className="font-mono text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                      to={ROUTES.semaspa.autefDetail.replace(':id', String(row.id))}
                    >
                      {row.number ?? `#${row.id}`}
                    </Link>
                  </TableCell>
                  <TableCell>{row.processNumber ?? '—'}</TableCell>
                  <TableCell>{[row.city, row.state].filter(Boolean).join(' / ') || '—'}</TableCell>
                  <TableCell className="tabular-nums">
                    {row.issuedAt
                      ? formatISODateLocal(row.issuedAt) || EMPTY_DATE_LABEL
                      : EMPTY_DATE_LABEL}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.forestGuides.list.totalRows', { count: autefs.total })}
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

export function ForestGuideDetailPage() {
  const { t } = useTranslation();
  const controller = useForestGuideDetailController();
  const { api, store, handlers } = controller;
  const activeTab = store.state.activeTab;

  if (!api.validId || api.isNotFound) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 max-w-md">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-base font-bold">{t('semaspa.forestGuides.detail.notFound')}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.forestGuides}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.forestGuides.detail.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (api.isErrorDetail) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.forestGuides.errors.detailTitle')}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.forestGuides}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.forestGuides.detail.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-4 shrink-0 border-b border-border space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link to={ROUTES.semaspa.forestGuides}>
            <ArrowLeft className="h-4 w-4" />
            {t('semaspa.forestGuides.detail.back')}
          </Link>
        </Button>
        <DetailSummary controller={controller} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handlers.handleActiveTabChange}
        className="flex-1 min-h-0 overflow-hidden px-6 pt-4"
      >
        <TabsList variant="line" className="shrink-0 w-full justify-start">
          <TabsTrigger value="species">{t('semaspa.forestGuides.tabs.species')}</TabsTrigger>
          <TabsTrigger value="roles">{t('semaspa.forestGuides.tabs.roles')}</TabsTrigger>
          <TabsTrigger value="autefs">{t('semaspa.forestGuides.tabs.autefs')}</TabsTrigger>
        </TabsList>
        <LazyTabsContent
          value="species"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <SpeciesTab controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="roles"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <RolesTab controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="autefs"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefsTab controller={controller} />
        </LazyTabsContent>
      </Tabs>
    </div>
  );
}
