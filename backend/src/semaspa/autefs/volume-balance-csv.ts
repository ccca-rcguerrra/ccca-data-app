import type { SelectQueryBuilder } from 'typeorm';
import { SemaspaAutefVolumeBalance } from '../../model/entities/semaspa-autef-volume-balance.view.entity';
import {
  AUTEF_VOLUME_BALANCE_SORT_FIELDS,
  type AutefVolumeBalanceSortField,
  type GetAutefNestedVolumeBalancesQueryDto,
} from './dto/get-autef-nested-volume-balances-query.dto';

export const VOLUME_BALANCE_CSV_ROW_LIMIT = 10_000;

const SORT_COLUMN: Record<AutefVolumeBalanceSortField, string> = {
  excessVolume: 'vb.excessVolume',
  movedRatio: 'vb.movedRatio',
  authorizedVolume: 'vb.authorizedVolume',
  id: 'vb.id',
};

export interface VolumeBalanceCsvRow {
  speciesProductId: string;
  scientificName: string | null;
  commonName: string | null;
  productName: string | null;
  authorizedVolume: number | null;
  authorizedUnit: string | null;
  movedVolume: number | null;
  movedUnit: string | null;
  excessVolume: number | null;
  movedRatio: number | null;
  isOverExtracted: boolean;
  hasUnitConflict: boolean;
}

export function resolveVolumeBalanceSort(
  query: Pick<GetAutefNestedVolumeBalancesQueryDto, 'sortBy' | 'sortOrder'>,
): { sortBy: AutefVolumeBalanceSortField; sortOrder: 'ASC' | 'DESC' } {
  const requested = query.sortBy ?? '';
  const isValid = (AUTEF_VOLUME_BALANCE_SORT_FIELDS as readonly string[]).includes(
    requested,
  );
  if (!isValid) {
    return { sortBy: 'excessVolume', sortOrder: 'DESC' };
  }
  const sortOrder = query.sortOrder === 'ASC' ? 'ASC' : 'DESC';
  return { sortBy: requested as AutefVolumeBalanceSortField, sortOrder };
}

export function applyVolumeBalanceSort(
  qb: SelectQueryBuilder<SemaspaAutefVolumeBalance>,
  query: Pick<GetAutefNestedVolumeBalancesQueryDto, 'sortBy' | 'sortOrder'>,
): void {
  const { sortBy, sortOrder } = resolveVolumeBalanceSort(query);
  qb.orderBy(SORT_COLUMN[sortBy], sortOrder, 'NULLS LAST');
  if (sortBy === 'excessVolume') {
    qb.addOrderBy('vb.movedRatio', 'DESC', 'NULLS LAST');
  }
  if (sortBy !== 'id') {
    qb.addOrderBy('vb.id', 'ASC');
  }
}

export function escapeCsv(
  value: string | number | boolean | null | undefined,
): string {
  if (value == null || value === '') return '';
  const text = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildVolumeBalancesCsvBody(
  autefId: number,
  generatedAt: string,
  rows: VolumeBalanceCsvRow[],
): string {
  const headerLines = [
    `# autef_id=${autefId}`,
    '# grain=species_product',
    '# gf_scope=GF1',
    `# generated_at=${generatedAt}`,
    '# columns=species_product_id,scientific_name,common_name,product_name,authorized_volume,authorized_unit,moved_volume,moved_unit,excess_volume,moved_ratio,is_over_extracted,has_unit_conflict',
  ];
  const csvHeader =
    'species_product_id,scientific_name,common_name,product_name,authorized_volume,authorized_unit,moved_volume,moved_unit,excess_volume,moved_ratio,is_over_extracted,has_unit_conflict';
  const csvRows = rows.map((row) =>
    [
      row.speciesProductId,
      row.scientificName,
      row.commonName,
      row.productName,
      row.authorizedVolume,
      row.authorizedUnit,
      row.movedVolume,
      row.movedUnit,
      row.excessVolume,
      row.movedRatio,
      row.isOverExtracted,
      row.hasUnitConflict,
    ]
      .map((value) => escapeCsv(value))
      .join(','),
  );
  return [...headerLines, csvHeader, ...csvRows].join('\n') + '\n';
}

export function mapVolumeBalanceCsvRow(
  row: Record<string, unknown>,
): VolumeBalanceCsvRow {
  return {
    speciesProductId: String(
      row.speciesProductId ?? row.species_product_id ?? '',
    ),
    scientificName: toNullableString(row.scientificName ?? row.scientific_name),
    commonName: toNullableString(row.commonName ?? row.common_name),
    productName: toNullableString(row.productName ?? row.product_name),
    authorizedVolume: toNullableNumber(
      row.authorizedVolume ?? row.authorized_volume,
    ),
    authorizedUnit: toNullableString(row.authorizedUnit ?? row.authorized_unit),
    movedVolume: toNullableNumber(row.movedVolume ?? row.moved_volume),
    movedUnit: toNullableString(row.movedUnit ?? row.moved_unit),
    excessVolume: toNullableNumber(row.excessVolume ?? row.excess_volume),
    movedRatio: toNullableNumber(row.movedRatio ?? row.moved_ratio),
    isOverExtracted: toBoolean(row.isOverExtracted ?? row.is_over_extracted),
    hasUnitConflict: toBoolean(row.hasUnitConflict ?? row.has_unit_conflict),
  };
}

function toNullableString(value: unknown): string | null {
  if (value == null || value === '') return null;
  return String(value);
}

function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 't' || value === 1;
}
