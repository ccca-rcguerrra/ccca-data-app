import { useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowLeft, Copy, Download, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import type { Coleta, ColetaBase, ColetaDocumento } from '@/types/semaspa';
import { useLocaleFormat } from '@/hooks/use-locale-format';
import {
  useCancelColetaMutation,
  useColetaQuery,
  useReprocessColetaMutation,
} from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';
import { downloadBlob } from '@/utils/download';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';

import { ColetaResultBadge, ColetaStatusBadge } from './components/coleta-status-badge';
import {
  coletaYear,
  documentStageKey,
  durationMinutes,
  formatColetaDateTime,
} from './coleta-display';

const headClass = 'h-auto px-4 py-3 text-xs font-semibold text-[#5c6b64]';

function stageLabel(
  doc: ColetaDocumento,
  t: (key: string) => string,
): string {
  if (doc.etapa) return doc.etapa;
  const key = documentStageKey(doc);
  return key ? t(`semaspa.coletas.etapa.${key}`) : '—';
}

function exportDocuments(coleta: Coleta, stage: (doc: ColetaDocumento) => string) {
  const header = ['documento', 'etapa', 'resultado', 'mensagem'];
  const lines = (coleta.documentos ?? []).map((doc) =>
    [doc.identificacao, stage(doc), doc.resultado, doc.mensagem ?? '']
      .map((value) => `"${String(value).split('"').join('""')}"`)
      .join(','),
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  downloadBlob(blob, `coleta-${coleta.taskId}.csv`);
}

export function ColetaDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { formatNumber } = useLocaleFormat();
  const navigate = useNavigate();
  const query = useColetaQuery(id);
  const cancelMutation = useCancelColetaMutation();
  const reprocessMutation = useReprocessColetaMutation();

  if (query.isError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f6f7f6] p-7">
        <div
          className="flex max-w-md flex-col items-center gap-3 rounded-lg border border-status-over/40 bg-status-over/10 p-6"
          role="alert"
        >
          <AlertCircle className="h-8 w-8 text-status-over" />
          <h2 className="text-base font-bold text-status-over">
            {t('semaspa.coletas.errors.title')}
          </h2>
          <p className="text-center text-sm">
            {query.error instanceof Error
              ? query.error.message
              : t('semaspa.coletas.errors.message')}
          </p>
        </div>
      </div>
    );
  }

  const coleta = query.data;
  const canCancel = coleta?.status === 'queued' || coleta?.status === 'running';
  const cancelling = cancelMutation.isPending;
  const reprocessing = reprocessMutation.isPending;
  const canReprocess = coleta?.base === 'autef' || coleta?.base === 'gf';

  const handleReprocess = () => {
    if (!coleta || !canReprocess) return;
    reprocessMutation.mutate(coleta.taskId, {
      onSuccess: (created) => {
        toast.success(t('semaspa.coletas.detail.reprocessSuccess'));
        navigate(ROUTES.semaspa.coletaDetail.replace(':id', created.taskId));
      },
      onError: () => toast.error(t('semaspa.coletas.detail.reprocessError')),
    });
  };

  const handleCancel = () => {
    if (!coleta) return;
    cancelMutation.mutate(coleta.taskId, {
      onSuccess: () => toast.success(t('semaspa.coletas.detail.cancelSuccess')),
      onError: () => toast.error(t('semaspa.coletas.detail.cancelError')),
    });
  };

  const year = coleta ? coletaYear(coleta.filtros) : null;
  const baseLabel =
    coleta?.base === 'autef' || coleta?.base === 'gf'
      ? t(`semaspa.coletas.base.${coleta.base as ColetaBase}`)
      : null;
  const minutes = coleta
    ? durationMinutes(coleta.inicioEm, coleta.concluidoEm, coleta.status)
    : null;
  const started = coleta ? formatColetaDateTime(coleta.inicioEm) : '—';
  const duration = minutes == null ? '—' : t('semaspa.coletas.detail.duration', { count: minutes });
  const meta = coleta?.solicitante?.name
    ? t('semaspa.coletas.detail.meta', {
        started,
        name: coleta.solicitante.name,
        duration,
      })
    : t('semaspa.coletas.detail.metaNoName', { started, duration });

  const found = coleta?.contadores.encontrados ?? 0;
  const processed = coleta
    ? coleta.contadores.gravados +
      coleta.contadores.jaExistentes +
      coleta.contadores.falhas +
      coleta.contadores.semPdf
    : 0;
  const progress = found > 0 ? Math.min(100, Math.round((processed / found) * 100)) : 0;

  const stats = coleta
    ? [
        {
          key: 'encontrados',
          label: t('semaspa.coletas.detail.encontrados'),
          value: formatNumber(coleta.contadores.encontrados),
          valueClass: 'text-[#0f1a16]',
        },
        {
          key: 'gravados',
          label: t('semaspa.coletas.detail.gravados'),
          value: formatNumber(coleta.contadores.gravados),
          valueClass: 'text-[#0e4b3b]',
        },
        {
          key: 'jaExistentes',
          label: t('semaspa.coletas.detail.jaExistentes'),
          value: formatNumber(coleta.contadores.jaExistentes),
          valueClass: 'text-[#0f1a16]',
        },
        {
          key: 'falhas',
          label: t('semaspa.coletas.detail.falhas'),
          value: formatNumber(coleta.contadores.falhas),
          valueClass: coleta.contadores.falhas > 0 ? 'text-[#c2413b]' : 'text-[#0f1a16]',
        },
      ]
    : [];

  const labelStage = (doc: ColetaDocumento) => stageLabel(doc, t);

  return (
    <div className="h-full w-full overflow-auto bg-[#f6f7f6]">
      <div className="flex flex-col gap-4 p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0e4b3b]"
              onClick={() => navigate(ROUTES.semaspa.coletas)}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('semaspa.coletas.detail.back')}
            </button>
            {!coleta ? (
              <p className="text-sm text-[#5c6b64]">{t('common.loading')}</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold leading-none text-[#0f1a16]">
                    {baseLabel && year
                      ? t('semaspa.coletas.detail.heading', { base: baseLabel, year })
                      : t('semaspa.coletas.detail.title')}
                  </h2>
                  <ColetaStatusBadge status={coleta.status} />
                </div>
                <p className="text-[13px] text-[#5c6b64]">{meta}</p>
              </>
            )}
          </div>

          {coleta ? (
            <div className="flex items-center gap-2">
              {canCancel ? (
                <Button
                  variant="outline"
                  className="h-auto gap-2 rounded-lg border-[#f3d7d4] bg-white px-3.5 py-2 text-[13px] font-normal text-[#c2413b] shadow-none hover:bg-[#fbe9e7]"
                  disabled={cancelling}
                  onClick={handleCancel}
                >
                  {cancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {cancelling
                    ? t('semaspa.coletas.detail.cancelling')
                    : t('semaspa.coletas.detail.cancel')}
                </Button>
              ) : null}
              {canReprocess ? (
                <Button
                  variant="outline"
                  className="h-auto gap-2 rounded-lg border-[#e4e8e5] bg-white px-3.5 py-2 text-[13px] font-normal text-[#0f1a16] shadow-none"
                  disabled={reprocessing || cancelling}
                  onClick={handleReprocess}
                >
                  {reprocessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {reprocessing
                    ? t('semaspa.coletas.detail.reprocessing')
                    : t('semaspa.coletas.detail.reprocess')}
                </Button>
              ) : null}
              <Button
                variant="outline"
                className="h-auto gap-2 rounded-lg border-[#e4e8e5] bg-white px-3.5 py-2 text-[13px] font-normal text-[#0f1a16] shadow-none"
                onClick={() => {
                  void navigator.clipboard.writeText(
                    JSON.stringify({ base: coleta.base, filtros: coleta.filtros }, null, 2),
                  );
                  toast.success(t('semaspa.coletas.detail.copied'));
                }}
              >
                <Copy className="h-4 w-4" />
                {t('semaspa.coletas.detail.copy')}
              </Button>
              <Button
                variant="outline"
                className="h-auto gap-2 rounded-lg border-[#e4e8e5] bg-white px-3.5 py-2 text-[13px] font-normal text-[#0f1a16] shadow-none"
                onClick={() => exportDocuments(coleta, labelStage)}
              >
                <Download className="h-4 w-4" />
                {t('semaspa.coletas.detail.export')}
              </Button>
            </div>
          ) : null}
        </div>

        {coleta ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-1.5 rounded-[10px] bg-white p-4"
                >
                  <p className="text-[11px] font-semibold tracking-wide text-[#5c6b64] uppercase">
                    {item.label}
                  </p>
                  <p className={`text-2xl font-bold leading-none ${item.valueClass}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <section className="flex flex-col gap-2.5 rounded-[10px] bg-white p-4">
              <h3 className="text-[13px] font-semibold text-[#0f1a16]">
                {t('semaspa.coletas.detail.searchTitle')}
              </h3>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eef1ef]">
                <div
                  className="h-1.5 rounded-full bg-[#0e4b3b]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-[#5c6b64]">
                {found > 0
                  ? t('semaspa.coletas.detail.searchProgress', {
                      done: formatNumber(processed),
                      total: formatNumber(found),
                      found: formatNumber(found),
                      base: baseLabel ?? '',
                    })
                  : t('semaspa.coletas.detail.searchPending')}
              </p>
            </section>

            <div className="overflow-hidden rounded-[10px] border border-[#e4e8e5] bg-white">
              <Table>
                <TableHeader className="bg-[#eef1ef] [&_tr]:border-[#e4e8e5] [&_tr]:hover:bg-[#eef1ef]">
                  <TableRow>
                    <TableHead className={headClass}>{t('semaspa.coletas.detail.docDocumento')}</TableHead>
                    <TableHead className={headClass}>{t('semaspa.coletas.detail.docEtapa')}</TableHead>
                    <TableHead className={headClass}>{t('semaspa.coletas.detail.docResultado')}</TableHead>
                    <TableHead className={headClass}>{t('semaspa.coletas.detail.docMensagem')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(coleta.documentos ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-8 text-center text-sm text-[#5c6b64]">
                        {t('semaspa.coletas.list.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (coleta.documentos ?? []).map((doc, index) => (
                      <TableRow key={`${doc.identificacao}-${index}`} className="border-[#e4e8e5]">
                        <TableCell className="px-4 py-3 text-[13px] text-[#0f1a16]">
                          {doc.identificacao}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[13px] text-[#5c6b64]">
                          {labelStage(doc)}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <ColetaResultBadge resultado={doc.resultado} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[13px] text-[#5c6b64]">
                          {doc.mensagem ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
