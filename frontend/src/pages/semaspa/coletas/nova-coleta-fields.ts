/**
 * Query keys sent as `params` to the Celery tasks
 * `run_autef_pipeline` and `run_gf_pipeline`.
 * `page_start`, `page_end` and `force_restart` are separate task arguments.
 */

export type ColetaFieldKind = 'date' | 'text';

export interface ColetaField {
  key: string;
  kind: ColetaFieldKind;
}

export const AUTEF_PRIMARY: ColetaField[] = [
  { key: 'data_inicio', kind: 'date' },
  { key: 'data_fim', kind: 'date' },
];

export const AUTEF_FILTERS: ColetaField[] = [
  { key: 'numero_processo', kind: 'text' },
  { key: 'numero_titulo', kind: 'text' },
  { key: 'cpf_cnpj_detentor', kind: 'text' },
  { key: 'nome_razaosocial_detentor', kind: 'text' },
  { key: 'cpf_cnpj_proprietario', kind: 'text' },
  { key: 'nome_razaosocial_proprietario', kind: 'text' },
  { key: 'cnpj_propriedade', kind: 'text' },
  { key: 'razaosocial_propriedade', kind: 'text' },
];

export const GF_PRIMARY: ColetaField[] = [
  { key: 'data_inicio', kind: 'date' },
  { key: 'data_fim', kind: 'date' },
];

export const GF_FILTERS: ColetaField[] = [
  { key: 'situacao', kind: 'text' },
  { key: 'tipo_guia', kind: 'text' },
  { key: 'numero', kind: 'text' },
  { key: 'codigo_controle', kind: 'text' },
  { key: 'cpf_cnpj_procedencia', kind: 'text' },
  { key: 'nome_procedencia', kind: 'text' },
  { key: 'ceprof_procedencia', kind: 'text' },
  { key: 'uf_procedencia', kind: 'text' },
  { key: 'municipio_procedencia', kind: 'text' },
  { key: 'cpf_cnpj_destino', kind: 'text' },
  { key: 'nome_destino', kind: 'text' },
  { key: 'ceprof_destino', kind: 'text' },
  { key: 'uf_destino', kind: 'text' },
  { key: 'municipio_destino', kind: 'text' },
];

export function fieldsFor(base: 'autef' | 'gf'): {
  primary: ColetaField[];
  more: ColetaField[];
} {
  if (base === 'gf') return { primary: GF_PRIMARY, more: GF_FILTERS };
  return { primary: AUTEF_PRIMARY, more: AUTEF_FILTERS };
}

export type PeriodIssue = 'missing' | 'order' | 'span';

const MAX_PERIOD_YEARS = 2;

function parseDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function formatDateParts(year: number, month: number, day: number): string {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

/** Adds calendar years. Overflow days clamp to the last day of the target month. */
export function addCalendarYears(value: string, years: number): string | null {
  const parts = parseDateParts(value);
  if (!parts) return null;
  const shifted = new Date(parts.year + years, parts.month - 1, parts.day);
  if (shifted.getMonth() === parts.month - 1) {
    return formatDateParts(shifted.getFullYear(), shifted.getMonth() + 1, shifted.getDate());
  }
  const lastDay = new Date(parts.year + years, parts.month, 0);
  return formatDateParts(lastDay.getFullYear(), lastDay.getMonth() + 1, lastDay.getDate());
}

export function periodIssue(start: string, end: string): PeriodIssue | null {
  if (!start || !end) return 'missing';
  if (!parseDateParts(start) || !parseDateParts(end)) return 'missing';
  if (end < start) return 'order';
  const limit = addCalendarYears(start, MAX_PERIOD_YEARS);
  if (!limit || end > limit) return 'span';
  return null;
}
