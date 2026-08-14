import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn/card';
import { Label } from '@/components/ui/shadcn/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/shadcn/sheet';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { ROUTES } from '@/constants/routes.constants';
import {
  useForestGuideAutefsQuery,
  useForestGuideQuery,
  useForestGuideRolesQuery,
  useForestGuideSpeciesQuery,
  usePeopleByIdsMap,
  useSpeciesProductsByIdsMap,
} from '@/hooks/api/use-semaspa';
import { formatISODateLocal, EMPTY_DATE_LABEL } from '@/utils/date';
import { formatPersonLabel, formatSpeciesProductLabel, formatVolume } from '../../autefs/utils/format';

interface ForestGuideDetailSheetProps {
  forestGuideId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Reusable sheet with forest guide detail (info, roles, species, related AUTEFs).
 */
export function ForestGuideDetailSheet({
  forestGuideId,
  open,
  onOpenChange,
}: ForestGuideDetailSheetProps) {
  const { t } = useTranslation();
  const enabled = open && forestGuideId != null && forestGuideId > 0;
  const id = forestGuideId ?? 0;

  const detailQuery = useForestGuideQuery(id, enabled);
  const speciesQuery = useForestGuideSpeciesQuery(id, { page: 1, limit: 100 }, { enabled });
  const rolesQuery = useForestGuideRolesQuery(id, { page: 1, limit: 100 }, { enabled });
  const autefsQuery = useForestGuideAutefsQuery(id, { page: 1, limit: 50 }, { enabled });

  const personIds = (rolesQuery.data?.data ?? []).map((row) => row.personId);
  const peopleMap = usePeopleByIdsMap(personIds);
  const speciesIds = (speciesQuery.data?.data ?? []).map((row) => row.speciesProductId);
  const speciesMap = useSpeciesProductsByIdsMap(speciesIds);

  const isLoading =
    detailQuery.isLoading ||
    speciesQuery.isLoading ||
    rolesQuery.isLoading ||
    autefsQuery.isLoading;

  const guide = detailQuery.data;
  const originRoles = (rolesQuery.data?.data ?? []).filter((r) =>
    r.role.toUpperCase().includes('ORIGEM'),
  );
  const destinationRoles = (rolesQuery.data?.data ?? []).filter((r) =>
    r.role.toUpperCase().includes('DESTINO'),
  );
  const otherRoles = (rolesQuery.data?.data ?? []).filter(
    (r) =>
      !r.role.toUpperCase().includes('ORIGEM') &&
      !r.role.toUpperCase().includes('DESTINO'),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('semaspa.forestGuides.sheet.title')}
          </SheetTitle>
          <SheetDescription>{t('semaspa.forestGuides.sheet.description')}</SheetDescription>
        </SheetHeader>

        <div className="px-6 py-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : null}

          {!isLoading && guide ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {guide.number
                      ? t('semaspa.forestGuides.detail.title', { number: guide.number })
                      : t('semaspa.forestGuides.detail.untitled', { id: guide.id })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">
                      {t('semaspa.forestGuides.detail.status')}
                    </Label>
                    <p className="font-medium">{guide.status ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t('semaspa.forestGuides.detail.type')}
                    </Label>
                    <p className="font-medium">{guide.type ?? '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t('semaspa.forestGuides.detail.issuedAt')}
                    </Label>
                    <p className="font-medium">
                      {guide.issuedAt
                        ? formatISODateLocal(guide.issuedAt) || EMPTY_DATE_LABEL
                        : EMPTY_DATE_LABEL}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      {t('semaspa.forestGuides.detail.plates')}
                    </Label>
                    <p className="font-medium">
                      {guide.vehiclePlates?.length ? guide.vehiclePlates.join(', ') : '—'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">
                      {t('semaspa.forestGuides.detail.permits')}
                    </Label>
                    <p className="font-medium">
                      {guide.permitRefs?.length ? guide.permitRefs.join(', ') : '—'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('semaspa.forestGuides.tabs.roles')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-muted-foreground font-medium">
                        {t('semaspa.forestGuides.roles.origin')}
                      </p>
                      {originRoles.length === 0 ? (
                        <p>—</p>
                      ) : (
                        originRoles.map((role) => (
                          <div key={role.id}>
                            <p className="font-medium">
                              {formatPersonLabel(peopleMap[role.personId], role.personId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {peopleMap[role.personId]?.taxId ?? role.role}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground font-medium">
                        {t('semaspa.forestGuides.roles.destination')}
                      </p>
                      {destinationRoles.length === 0 ? (
                        <p>—</p>
                      ) : (
                        destinationRoles.map((role) => (
                          <div key={role.id}>
                            <p className="font-medium">
                              {formatPersonLabel(peopleMap[role.personId], role.personId)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {peopleMap[role.personId]?.taxId ?? role.role}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {otherRoles.length > 0 ? (
                    <div className="space-y-2">
                      {otherRoles.map((role) => (
                        <div key={role.id} className="flex items-center justify-between gap-2">
                          <span>
                            {formatPersonLabel(peopleMap[role.personId], role.personId)}
                          </span>
                          <Badge variant="outline">{role.role}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {t('semaspa.forestGuides.tabs.species')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(speciesQuery.data?.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('semaspa.forestGuides.species.noResults')}
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('semaspa.forestGuides.species.scientificName')}</TableHead>
                          <TableHead>{t('semaspa.forestGuides.species.volume')}</TableHead>
                          <TableHead>{t('semaspa.forestGuides.species.value')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(speciesQuery.data?.data ?? []).map((row) => {
                          const product = speciesMap[row.speciesProductId];
                          return (
                            <TableRow key={row.id}>
                              <TableCell>
                                {formatSpeciesProductLabel(product, row.speciesProductId)}
                              </TableCell>
                              <TableCell>{formatVolume(row.volume, row.unit)}</TableCell>
                              <TableCell>{formatCurrency(row.value)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('semaspa.forestGuides.tabs.autefs')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(autefsQuery.data?.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('semaspa.forestGuides.autefs.noResults')}
                    </p>
                  ) : (
                    (autefsQuery.data?.data ?? []).map((autef) => (
                      <div
                        key={autef.id}
                        className="flex items-center justify-between gap-3 border rounded-lg p-3"
                      >
                        <div>
                          <p className="font-medium">{autef.number ?? `#${autef.id}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {[autef.city, autef.state].filter(Boolean).join(' / ') || '—'}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link to={ROUTES.semaspa.autefDetail.replace(':id', String(autef.id))}>
                            {t('semaspa.forestGuides.sheet.openAutef')}
                          </Link>
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
