import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

import { ROUTES } from '@/constants/routes.constants';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { formatPersonLabel } from '../../autefs/utils/format';
import type { PersonDetailController } from '../hooks/use-person-detail-controller';

export function PersonProfileHeader({ controller }: { controller: PersonDetailController }) {
  const { t } = useTranslation();
  const { person, isLoadingPerson } = controller.api;

  if (isLoadingPerson && !person) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
    );
  }

  if (!person) return null;

  const names = person.names?.filter(Boolean) ?? [];
  const extraNames = names.slice(1);
  const location = [person.city, person.state].filter(Boolean).join(' / ') || '—';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to={ROUTES.semaspa.people}>
            <ArrowLeft className="h-4 w-4" />
            {t('semaspa.people.detail.back')}
          </Link>
        </Button>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t('semaspa.people.detail.eyebrow')}
        </p>
        <h1 className="text-xl font-semibold mt-1">{formatPersonLabel(person, person.id)}</h1>
        {extraNames.length > 0 ? (
          <p className="text-sm text-muted-foreground mt-1">{extraNames.join(' · ')}</p>
        ) : null}
        <p className="text-sm text-muted-foreground mt-1">{t('semaspa.people.detail.question')}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <MetaField label={t('semaspa.people.table.taxId')} value={person.taxId ?? '—'} mono />
        <MetaField label={t('semaspa.people.table.city')} value={location} />
        <MetaField
          label={t('semaspa.people.table.sources')}
          value={person.sources?.filter(Boolean).join(', ') || '—'}
        />
        <MetaField
          label={t('semaspa.people.table.occurrences')}
          value={person.occurrenceCount != null ? String(person.occurrenceCount) : '—'}
        />
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={mono ? 'font-mono text-[13px] font-medium' : 'font-medium'}>{value}</p>
    </div>
  );
}
