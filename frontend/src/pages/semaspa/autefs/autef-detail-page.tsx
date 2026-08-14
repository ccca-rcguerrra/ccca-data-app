import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { LazyTabsContent } from '@/components/ui/lazy-tabs-content';
import { ROUTES } from '@/constants/routes.constants';
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import {
  useAutefDetailController,
  type AutefDetailController,
} from './hooks/use-autef-detail-controller';
import { AutefSpeciesTable } from './components/autef-species-table';
import { AutefForestGuidesTable } from './components/autef-forest-guides-table';
import { AutefHarvestUnitsPanel } from './components/autef-harvest-units-panel';
import { AutefRolesCards } from './components/autef-roles-cards';

function AutefDetailSummary({ controller }: { controller: AutefDetailController }) {
  const { t } = useTranslation();
  const { autef, isLoadingAutef } = controller.api;

  if (isLoadingAutef) {
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

  if (!autef) return null;

  const title = autef.number
    ? t('semaspa.autefs.detail.title', { number: autef.number })
    : t('semaspa.autefs.detail.untitled', { id: autef.id });

  const location = [autef.city, autef.state].filter(Boolean).join(' / ') || '—';
  const area =
    autef.totalAreaHa != null
      ? t('semaspa.autefs.detail.hectares', {
          value: autef.totalAreaHa.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        })
      : '—';

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {autef.title ? (
          <p className="text-sm text-muted-foreground mt-1">{autef.title}</p>
        ) : null}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground">{t('semaspa.autefs.detail.processNumber')}</p>
          <p className="font-medium">{autef.processNumber ?? '—'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('semaspa.autefs.detail.cityState')}</p>
          <p className="font-medium">{location}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('semaspa.autefs.detail.totalAreaHa')}</p>
          <p className="font-medium">{area}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{t('semaspa.autefs.detail.issuedAt')}</p>
          <p className="font-medium">
            {autef.issuedAt
              ? formatISODateLocal(autef.issuedAt) || EMPTY_DATE_LABEL
              : EMPTY_DATE_LABEL}
            {autef.issueYear != null ? ` (${autef.issueYear})` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AutefDetailPage() {
  const { t } = useTranslation();
  const controller = useAutefDetailController();
  const { api, store, handlers } = controller;
  const activeTab = store.state.activeTab;

  if (!api.validId || api.isNotFound) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 max-w-md">
          <AlertCircle className="h-8 w-8 text-muted-foreground shrink-0" />
          <h2 className="text-base font-bold">{t('semaspa.autefs.detail.notFound')}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.autefs}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.autefs.detail.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (api.isErrorAutef) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-[var(--color-error-500)] bg-[var(--color-error-bg)] p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-[var(--color-error-500)] shrink-0" />
          <h2 className="text-base font-bold text-[var(--color-error-500)]">
            {t('semaspa.autefs.errors.detailTitle')}
          </h2>
          <p className="text-sm text-center text-foreground">
            {api.errorAutef instanceof Error
              ? api.errorAutef.message
              : t('semaspa.autefs.errors.message')}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.autefs}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.autefs.detail.back')}
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
          <Link to={ROUTES.semaspa.autefs}>
            <ArrowLeft className="h-4 w-4" />
            {t('semaspa.autefs.detail.back')}
          </Link>
        </Button>
        <AutefDetailSummary controller={controller} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handlers.handleActiveTabChange}
        className="flex-1 min-h-0 overflow-hidden px-6 pt-4"
      >
        <TabsList variant="line" className="shrink-0 w-full justify-start">
          <TabsTrigger value="species">{t('semaspa.autefs.tabs.species')}</TabsTrigger>
          <TabsTrigger value="forestGuides">{t('semaspa.autefs.tabs.forestGuides')}</TabsTrigger>
          <TabsTrigger value="harvestUnits">{t('semaspa.autefs.tabs.harvestUnits')}</TabsTrigger>
          <TabsTrigger value="roles">{t('semaspa.autefs.tabs.roles')}</TabsTrigger>
        </TabsList>

        <LazyTabsContent
          value="species"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefSpeciesTable controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="forestGuides"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefForestGuidesTable controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="harvestUnits"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefHarvestUnitsPanel controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="roles"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefRolesCards controller={controller} />
        </LazyTabsContent>
      </Tabs>
    </div>
  );
}
