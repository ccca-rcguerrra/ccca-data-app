import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import type { FeatureCollection } from 'geojson';

import { geometryLayerStyles } from '@/constants/geometry-styles.constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';
import { Map, GeoJSONLayer } from '@/components/map';

import type { AutefDetailController } from '../hooks/use-autef-detail-controller';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface Props {
  controller: AutefDetailController;
}

export function AutefHarvestUnitsPanel({ controller }: Props) {
  const { t } = useTranslation();
  const {
    api: { harvestUnits, isLoadingHarvestUnits, autef },
    store: { state },
    handlers: { handleTabPageChange, handleTabPageSizeChange },
  } = controller;

  const tab = state.tabs.harvestUnits;
  const rows = harvestUnits.data;

  const geojson = useMemo((): FeatureCollection | null => {
    const features = rows
      .filter((row) => row.geometry)
      .map((row) => ({
        type: 'Feature' as const,
        id: row.id,
        properties: {
          id: row.id,
          propertyName: row.propertyName,
          holder: row.holder,
        },
        geometry: row.geometry!,
      }));

    if (features.length === 0) return null;
    return { type: 'FeatureCollection', features };
  }, [rows]);

  const center = useMemo((): [number, number] => {
    const lat = autef?.latitude != null ? Number(autef.latitude) : NaN;
    const lon = autef?.longitude != null ? Number(autef.longitude) : NaN;
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) return [lon, lat];
    return [-52.5, -3.5];
  }, [autef]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="m-4 space-y-4">
          <div className="rounded-lg border border-[var(--color-neutral-300)] overflow-hidden h-[280px]">
            {isLoadingHarvestUnits && !geojson ? (
              <Skeleton className="h-full w-full rounded-none" />
            ) : geojson ? (
              <Map center={center} zoom={10} className="h-full w-full">
                <GeoJSONLayer
                  id={`autef-${autef?.id ?? 'harvest'}-units`}
                  data={geojson}
                  style={geometryLayerStyles.alertBase}
                  fitBounds
                />
              </Map>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                {t('semaspa.autefs.harvestUnits.noGeometry')}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--color-neutral-300)]">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>{t('semaspa.autefs.harvestUnits.propertyName')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.holder')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.city')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.propertyAreaHa')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.unitAreaHa')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.netAreaHa')}</TableHead>
                  <TableHead>{t('semaspa.autefs.harvestUnits.volumeM3')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingHarvestUnits && rows.length === 0
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : null}
                {!isLoadingHarvestUnits && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {t('semaspa.autefs.harvestUnits.noResults')}
                    </TableCell>
                  </TableRow>
                ) : null}
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.propertyName ?? '—'}</TableCell>
                    <TableCell>{row.holder ?? '—'}</TableCell>
                    <TableCell>{row.city ?? '—'}</TableCell>
                    <TableCell>{row.propertyAreaHa ?? '—'}</TableCell>
                    <TableCell>{row.unitAreaHa ?? '—'}</TableCell>
                    <TableCell>{row.netAreaHa ?? '—'}</TableCell>
                    <TableCell>{row.volumeM3 ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <ListPaginationFooter
        leftContent={t('semaspa.autefs.list.totalRows', { count: harvestUnits.total })}
        pageSize={tab.pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageSizeChange={(size) => handleTabPageSizeChange('harvestUnits', size)}
        currentPage={harvestUnits.page || tab.page}
        totalPages={Math.max(1, harvestUnits.totalPages)}
        canPrev={harvestUnits.hasPrev}
        canNext={harvestUnits.hasNext}
        onPageChange={(page) => handleTabPageChange('harvestUnits', page)}
        isBusy={isLoadingHarvestUnits}
      />
    </div>
  );
}
