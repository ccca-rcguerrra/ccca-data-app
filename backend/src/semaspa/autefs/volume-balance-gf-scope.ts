import { VolumeBalanceForestGuideResponseDto } from './dto/volume-balance-forest-guide-response.dto';

export const VOLUME_BALANCE_GF_TYPE = 'GF1';

export const VOLUME_BALANCE_GF_STATUSES = [
  'AGUARDANDO_RECEBIMENTO',
  'ATIVO',
  'RECEBIDO',
  'RECEBIDO_VENCIDO',
] as const;

export function applyVolumeBalanceGfScope(qb: {
  andWhere: (sql: string, params?: Record<string, unknown>) => unknown;
}): void {
  qb.andWhere('gf.type = :gfType', { gfType: VOLUME_BALANCE_GF_TYPE });
  qb.andWhere('gf.status IN (:...gfStatuses)', {
    gfStatuses: [...VOLUME_BALANCE_GF_STATUSES],
  });
}

export function parseNumeric(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapVolumeBalanceForestGuideRow(
  row: Record<string, unknown>,
): VolumeBalanceForestGuideResponseDto {
  const issuedAt = row.issued_at;
  return {
    forestGuideId: Number(row.forest_guide_id),
    number: typeof row.number === 'string' ? row.number : null,
    issuedAt: issuedAt instanceof Date || typeof issuedAt === 'string' ? issuedAt : null,
    status: typeof row.status === 'string' ? row.status : null,
    type: typeof row.type === 'string' ? row.type : null,
    volume: parseNumeric(row.volume),
    unit: typeof row.unit === 'string' ? row.unit : null,
    speciesProductId: String(row.species_product_id ?? ''),
    runningTotal: parseNumeric(row.running_total) ?? 0,
  };
}
