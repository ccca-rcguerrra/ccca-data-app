import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/constants/routes.constants';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/shadcn/tabs';
import { Button } from '@/components/ui/shadcn/button';
import { LazyTabsContent } from '@/components/ui/lazy-tabs-content';

import { usePersonDetailController } from './hooks/use-person-detail-controller';
import { PersonProfileHeader } from './components/person-profile-header';
import { PersonOverviewPanel } from './components/person-overview-panel';
import { PersonAutefsTable } from './components/person-autefs-table';
import { PersonForestGuidesTable } from './components/person-forest-guides-table';

export function PersonDetailPage() {
  const { t } = useTranslation();
  const controller = usePersonDetailController();
  const { api, store, handlers } = controller;
  const activeTab = store.state.activeTab;

  if (!api.validId || api.isNotFound) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/30 p-6 max-w-md">
          <AlertCircle className="h-8 w-8 text-muted-foreground shrink-0" />
          <h2 className="text-base font-bold">{t('semaspa.people.detail.notFound')}</h2>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.people}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.people.detail.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (api.isErrorPerson) {
    return (
      <div className="flex items-center justify-center w-full h-full p-6">
        <div
          className="flex flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6 max-w-md"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over shrink-0" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.people.errors.detailTitle')}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.semaspa.people}>
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.people.detail.back')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-4 shrink-0 border-b border-border">
        <PersonProfileHeader controller={controller} />
      </div>
      <Tabs
        value={activeTab}
        onValueChange={handlers.handleActiveTabChange}
        className="flex-1 min-h-0 overflow-hidden px-6 pt-4"
      >
        <TabsList variant="line" className="shrink-0 w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t('semaspa.people.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="autefs">{t('semaspa.people.tabs.autefs')}</TabsTrigger>
          <TabsTrigger value="forestGuides">{t('semaspa.people.tabs.forestGuides')}</TabsTrigger>
        </TabsList>
        <LazyTabsContent
          value="overview"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <PersonOverviewPanel controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="autefs"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <PersonAutefsTable controller={controller} />
        </LazyTabsContent>
        <LazyTabsContent
          value="forestGuides"
          activeValue={activeTab}
          className="flex-1 min-h-0 overflow-hidden mt-0 data-[state=inactive]:hidden"
        >
          <PersonForestGuidesTable controller={controller} />
        </LazyTabsContent>
      </Tabs>
    </div>
  );
}
