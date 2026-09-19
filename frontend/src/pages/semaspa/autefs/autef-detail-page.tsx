import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/constants/routes.constants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Button } from '@/components/ui/shadcn/button';
import { LazyTabsContent } from '@/components/ui/lazy-tabs-content';

import { useAutefDetailController } from './hooks/use-autef-detail-controller';
import { AutefSpeciesTable } from './components/autef-species-table';
import { AutefRolesCards } from './components/autef-roles-cards';
import { AutefOverviewPanel } from './components/autef-overview-panel';
import { AutefHarvestUnitsPanel } from './components/autef-harvest-units-panel';
import { AutefForestGuidesTable } from './components/autef-forest-guides-table';
import { AutefDossierHeader } from './components/autef-dossier-header';
import { AutefPlatesTable } from './components/autef-plates-table';
import { ForestGuideDetailSheet } from '../forest-guides/components/forest-guide-detail-sheet';

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
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over shrink-0" />
          <h2 className="text-base font-bold text-status-over">
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
      <div className="p-6 pb-4 shrink-0 border-b border-border">
        <AutefDossierHeader controller={controller} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handlers.handleActiveTabChange}
        className="flex-1 min-h-0 overflow-hidden px-6 pt-4"
      >
        <TabsList variant="line" className="shrink-0 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t('semaspa.autefs.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="species">{t('semaspa.autefs.tabs.species')}</TabsTrigger>
          <TabsTrigger value="forestGuides">{t('semaspa.autefs.tabs.forestGuides')}</TabsTrigger>
          <TabsTrigger value="harvestUnits">{t('semaspa.autefs.tabs.harvestUnits')}</TabsTrigger>
          <TabsTrigger value="roles">{t('semaspa.autefs.tabs.roles')}</TabsTrigger>
          <TabsTrigger value="plates">{t('semaspa.autefs.tabs.plates')}</TabsTrigger>
        </TabsList>

        <LazyTabsContent
          value="overview"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefOverviewPanel controller={controller} />
        </LazyTabsContent>
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
        <LazyTabsContent
          value="plates"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <AutefPlatesTable controller={controller} />
        </LazyTabsContent>
      </Tabs>

      <ForestGuideDetailSheet
        forestGuideId={store.state.selectedForestGuideId}
        open={store.state.forestGuideSheetOpen}
        onOpenChange={handlers.handleForestGuideSheetOpenChange}
      />
    </div>
  );
}
