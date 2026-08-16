import { INDICATOR_IDS } from './indicator-catalog';
import { IndicatorCaseResponseDto } from './dto/indicator-case-response.dto';

export function toBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === 't' || value === 1;
}

export function toNullableNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toRequiredCount(value: unknown): number {
  return toNullableNumber(value) ?? 0;
}

export function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.length > 0 ? value : null;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function toStringArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) {
    const items = value
      .map((item) => (typeof item === 'string' ? item : String(item)))
      .filter((item) => item.length > 0);
    return items.length > 0 ? items : null;
  }
  if (typeof value === 'string' && value.length > 0) return [value];
  return null;
}

export function mapAutefCase(row: Record<string, unknown>): IndicatorCaseResponseDto {
  const matchedIndicatorIds: string[] = [];
  if (toBoolean(row.hasOverExtracted ?? row.has_over_extracted)) {
    matchedIndicatorIds.push(INDICATOR_IDS.OVER_EXTRACTED);
  }
  if (toBoolean(row.hasCreditUseOver90 ?? row.has_credit_use_over_90)) {
    matchedIndicatorIds.push(INDICATOR_IDS.CREDIT_USE_OVER_90);
  }
  if (toBoolean(row.hasUnitConflict ?? row.has_unit_conflict)) {
    matchedIndicatorIds.push(INDICATOR_IDS.UNIT_CONFLICT);
  }

  return {
    entity: 'autef',
    autefId: Number(row.autefId ?? row.autef_id),
    number: toNullableString(row.number),
    city: toNullableString(row.city),
    state: toNullableString(row.state),
    issuedAt: (row.issuedAt ?? row.issued_at ?? null) as Date | string | null,
    matchedIndicatorIds,
    maxMovedRatio: toNullableNumber(row.maxMovedRatio ?? row.max_moved_ratio),
    maxExcessVolume: toNullableNumber(
      row.maxExcessVolume ?? row.max_excess_volume,
    ),
    hasUnitConflict: toBoolean(row.hasUnitConflict ?? row.has_unit_conflict),
  };
}

export function mapPersonCase(row: Record<string, unknown>): IndicatorCaseResponseDto {
  return {
    entity: 'person',
    personId: toNullableString(row.personId ?? row.person_id) ?? '',
    names: toStringArray(row.names),
    taxId: toNullableString(row.taxId ?? row.tax_id),
    city: toNullableString(row.city),
    state: toNullableString(row.state),
    roleTypes: toStringArray(row.roleTypes ?? row.role_types),
    distinctAutefCount: toRequiredCount(
      row.distinctAutefCount ?? row.distinct_autef_count,
    ),
    distinctGfCount: toRequiredCount(
      row.distinctGfCount ?? row.distinct_gf_count,
    ),
  };
}

export function mapPlateCase(row: Record<string, unknown>): IndicatorCaseResponseDto {
  return {
    entity: 'plate',
    plate: (toNullableString(row.plate) ?? '').trim(),
    distinctGfCount: toRequiredCount(
      row.distinctGfCount ?? row.distinct_gf_count,
    ),
    distinctAutefCount: toRequiredCount(
      row.distinctAutefCount ?? row.distinct_autef_count,
    ),
  };
}
