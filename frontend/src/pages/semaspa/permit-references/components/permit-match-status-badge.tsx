import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/shadcn/badge';
import type { PermitReferenceMatchStatus } from '@/types/semaspa';

const VARIANT: Record<PermitReferenceMatchStatus, 'secondary' | 'destructive' | 'outline'> = {
  unparseable: 'destructive',
  unmatched: 'destructive',
  matched: 'secondary',
  ambiguous: 'outline',
};

export function PermitMatchStatusBadge({
  status,
}: {
  status: PermitReferenceMatchStatus | string;
}) {
  const { t } = useTranslation();
  const key = status as PermitReferenceMatchStatus;
  const variant = VARIANT[key] ?? 'outline';
  return (
    <Badge variant={variant}>
      {t(`semaspa.permitReferences.status.${key}`, { defaultValue: status })}
    </Badge>
  );
}

export function hasBrokenPermitRef(
  statuses: Array<PermitReferenceMatchStatus | string> | null | undefined,
): boolean {
  return (statuses ?? []).some(
    (status) => status === 'unparseable' || status === 'unmatched',
  );
}
