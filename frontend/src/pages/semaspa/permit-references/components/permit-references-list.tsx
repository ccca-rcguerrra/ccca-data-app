import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/constants/routes.constants';
import type { PermitReference } from '@/types/semaspa';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { PermitMatchStatusBadge } from './permit-match-status-badge';

interface PermitReferencesListProps {
  rows: PermitReference[];
  emptyLabel: string;
  showForestGuide?: boolean;
}

export function PermitReferencesList({
  rows,
  emptyLabel,
  showForestGuide = false,
}: PermitReferencesListProps) {
  const { t } = useTranslation();
  const colCount = showForestGuide ? 5 : 4;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            {showForestGuide ? (
              <TableHead>{t('semaspa.permitReferences.table.forestGuide')}</TableHead>
            ) : null}
            <TableHead>{t('semaspa.permitReferences.table.rawReference')}</TableHead>
            <TableHead>{t('semaspa.permitReferences.table.status')}</TableHead>
            <TableHead>{t('semaspa.permitReferences.table.parsed')}</TableHead>
            <TableHead>{t('semaspa.permitReferences.table.autef')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {showForestGuide ? (
                  <TableCell>
                    <Link
                      className="font-mono text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                      to={ROUTES.semaspa.forestGuideDetail.replace(
                        ':id',
                        String(row.forestGuideId),
                      )}
                    >
                      {row.forestGuideNumber ?? `#${row.forestGuideId}`}
                    </Link>
                  </TableCell>
                ) : null}
                <TableCell className="font-mono text-[13px]">{row.rawReference}</TableCell>
                <TableCell>
                  <PermitMatchStatusBadge status={row.matchStatus} />
                </TableCell>
                <TableCell className="font-mono text-[13px] text-muted-foreground">
                  {row.parsedNumber && row.parsedYear
                    ? `${row.parsedNumber}/${row.parsedYear}`
                    : '—'}
                </TableCell>
                <TableCell>
                  {row.autefId != null ? (
                    <Link
                      className="font-mono text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                      to={ROUTES.semaspa.autefDetail.replace(':id', String(row.autefId))}
                    >
                      {row.autefNumber ?? `#${row.autefId}`}
                    </Link>
                  ) : (
                    '—'
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
