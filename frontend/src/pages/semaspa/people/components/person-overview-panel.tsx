import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import type { PersonDetailController } from '../hooks/use-person-detail-controller';

const LIMITATION_COUNT = 3;

export function PersonOverviewPanel({ controller }: { controller: PersonDetailController }) {
  const { t } = useTranslation();
  const { participation, isLoadingParticipation } = controller.api;

  const items = [
    {
      key: 'owner',
      count: participation.ownerAutefCount,
    },
    {
      key: 'technicalResponsible',
      count: participation.technicalResponsibleAutefCount,
    },
    {
      key: 'analyst',
      count: participation.analystAutefCount,
    },
    {
      key: 'origin',
      count: participation.originGfCount,
    },
    {
      key: 'destination',
      count: participation.destinationGfCount,
    },
  ] as const;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {t('semaspa.people.participation.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingParticipation ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-5 w-64" />
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {items.map((item) => (
                <li key={item.key}>
                  {t(`semaspa.people.participation.${item.key}`, { count: item.count })}
                </li>
              ))}
              <li className="text-muted-foreground pt-2">
                {t('semaspa.people.participation.distinctAutefs', {
                  count: participation.distinctAutefCount,
                })}
              </li>
              <li className="text-muted-foreground">
                {t('semaspa.people.participation.distinctGfs', {
                  count: participation.distinctGfCount,
                })}
              </li>
            </ul>
          )}
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-medium text-foreground">
          {t('semaspa.people.identity.limitationsTitle')}
        </p>
        <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
          {Array.from({ length: LIMITATION_COUNT }, (_, index) => (
            <li key={index}>{t(`semaspa.people.identity.limitations.${index}`)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
