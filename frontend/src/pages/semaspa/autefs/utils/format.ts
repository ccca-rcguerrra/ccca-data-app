import type { Person, SpeciesProduct } from '@/types/semaspa';

export function truncateId(id: string, length = 8): string {
  if (id.length <= length) return id;
  return `${id.slice(0, length)}…`;
}

export function formatSpeciesProductLabel(
  product: SpeciesProduct | undefined,
  fallbackId: string,
): string {
  if (!product) return truncateId(fallbackId);
  const parts = [product.scientificName, product.commonName, product.productName].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : truncateId(fallbackId);
}

export function formatPersonLabel(person: Person | undefined, fallbackId: string): string {
  if (!person) return truncateId(fallbackId);
  const names = person.names?.filter(Boolean) ?? [];
  if (names.length > 0) return names[0]!;
  if (person.taxId) return person.taxId;
  return truncateId(fallbackId);
}

export function formatVolume(value: number | null, unit: string | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatRatio(value: number | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${(value * 100).toLocaleString(undefined, { maximumFractionDigits: 1 })}%`;
}
