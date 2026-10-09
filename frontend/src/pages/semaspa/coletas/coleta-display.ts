import { format, parseISO } from 'date-fns';

import type {
  ColetaDocumento,
  ColetaDocumentoResultado,
  ColetaStatus,
} from '@/types/semaspa';

const HAS_TIMEZONE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** Celery stores `date_done` as naive UTC. Treat missing offsets as UTC. */
export function parseColetaInstant(value: string | null | undefined): Date | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = parseISO(HAS_TIMEZONE.test(trimmed) ? trimmed : `${trimmed}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatColetaDateTime(value: string | null | undefined): string {
  const date = parseColetaInstant(value);
  if (!date) return '—';
  return format(date, 'dd/MM/yyyy HH:mm');
}

export function coletaRecorte(filtros: Record<string, unknown>): string {
  const year = coletaYear(filtros);
  const start = filtros.data_inicio;
  const end = filtros.data_fim;
  if (typeof start === 'string' && typeof end === 'string' && start && end) {
    return start.slice(0, 4) === end.slice(0, 4) ? start.slice(0, 4) : `${start.slice(0, 4)}–${end.slice(0, 4)}`;
  }
  return year ?? '—';
}

export function coletaYear(filtros: Record<string, unknown>): string | null {
  const year = filtros.ano;
  if (typeof year === 'number' || (typeof year === 'string' && year !== '')) {
    return String(year);
  }
  const start = filtros.data_inicio;
  if (typeof start === 'string' && start.length >= 4) return start.slice(0, 4);
  return null;
}

export function countLabel(
  status: ColetaStatus,
  value: number,
  formatNumber: (value: number) => string,
): string {
  if (status === 'queued') return '—';
  return formatNumber(value);
}

export function durationMinutes(
  startedAt: string | null,
  finishedAt: string | null,
  status: ColetaStatus,
): number | null {
  if (!startedAt) return null;
  const start = parseColetaInstant(startedAt)?.getTime();
  if (start == null) return null;
  const endSource = status === 'queued' || status === 'running' ? null : finishedAt;
  const end = endSource ? parseColetaInstant(endSource)?.getTime() : Date.now();
  if (end == null || Number.isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 60000));
}

const STAGE_BY_RESULT: Partial<Record<ColetaDocumentoResultado, string>> = {
  gravado: 'gravacao',
  ja_existente: 'gravacao',
  sem_pdf: 'leitura',
  falha: 'download',
  em_andamento: 'download',
  aguardando: 'fila',
};

export function documentStageKey(doc: ColetaDocumento): string | null {
  if (doc.etapa) return null;
  return STAGE_BY_RESULT[doc.resultado] ?? null;
}
