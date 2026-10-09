import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Plus } from 'lucide-react';

import type { ColetaBase, ColetaStatus } from '@/types/semaspa';
import { useLocaleFormat } from '@/hooks/use-locale-format';
import { useColetasQuery } from '@/hooks/api/use-semaspa';
import { ROUTES } from '@/constants/routes.constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { Button } from '@/components/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { ListPaginationFooter } from '@/components/ui/list-pagination-footer';

import { NovaColetaPanel } from './components/nova-coleta-panel';
import { ColetaStatusBadge } from './components/coleta-status-badge';
import { coletaRecorte, countLabel, formatColetaDateTime } from './coleta-display';

const STATUSES: ColetaStatus[] = [
  'queued',
  'running',
  'completed',
  'completed_with_issues',
  'failed',
  'cancelled',
];

const headClass = 'h-auto px-4 py-3 text-xs font-semibold text-[#5c6b64]';
const cellClass = 'px-4 py-3 text-[13px] text-[#0f1a16]';

export function ColetasListPage() {
  const { t } = useTranslation();
  const { formatNumber } = useLocaleFormat();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [panelOpen, setPanelOpen] = useState(false);
  const [baseFilter, setBaseFilter] = useState<'all' | ColetaBase>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ColetaStatus>('all');

  const query = useColetasQuery({ limit: 200, offset: 0 });

  const filtered = useMemo(() => {
    const rows = query.data?.runs ?? [];
    return rows.filter((coleta) => {
      if (baseFilter !== 'all' && coleta.base !== baseFilter) return false;
      if (statusFilter !== 'all' && coleta.status !== statusFilter) return false;
      return true;
    });
  }, [query.data?.runs, baseFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#f6f7f6]">
      <div className="flex min-h-0 flex-1 flex-col gap-[18px] overflow-auto p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-bold leading-none text-[#0f1a16]">
              {t('semaspa.coletas.list.title')}
            </h2>
            <p className="max-w-[560px] text-sm text-[#5c6b64]">
              {t('semaspa.coletas.list.subtitle')}
            </p>
          </div>
          <Button
            className="h-auto gap-2 rounded-lg bg-[#0e4b3b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0c3f32]"
            onClick={() => setPanelOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('semaspa.coletas.list.nova')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={baseFilter}
            onValueChange={(value) => {
              setBaseFilter(value as 'all' | ColetaBase);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[200px] rounded-lg border-[#e4e8e5] bg-white px-3 text-[13px] text-[#0f1a16]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('semaspa.coletas.list.allBases')}</SelectItem>
              <SelectItem value="autef">{t('semaspa.coletas.base.autef')}</SelectItem>
              <SelectItem value="gf">{t('semaspa.coletas.base.gf')}</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as 'all' | ColetaStatus);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-[220px] rounded-lg border-[#e4e8e5] bg-white px-3 text-[13px] text-[#0f1a16]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('semaspa.coletas.list.allStatuses')}</SelectItem>
              {STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`semaspa.coletas.status.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-[10px] border border-[#e4e8e5] bg-white">
          <Table>
            <TableHeader className="bg-[#eef1ef] [&_tr]:border-[#e4e8e5] [&_tr]:hover:bg-[#eef1ef]">
              <TableRow>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.base')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.recorte')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.situacao')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.gravados')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.jaExistentes')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.falhas')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.inicio')}</TableHead>
                <TableHead className={headClass}>{t('semaspa.coletas.columns.solicitante')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!query.isLoading && pageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-[#5c6b64]">
                    {t('semaspa.coletas.list.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((coleta) => {
                  const recorte = coletaRecorte(coleta.filtros);
                  const failures = coleta.contadores.falhas;
                  return (
                    <TableRow
                      key={coleta.taskId}
                      className="cursor-pointer border-[#e4e8e5]"
                      onClick={() =>
                        navigate(ROUTES.semaspa.coletaDetail.replace(':id', coleta.taskId))
                      }
                    >
                      <TableCell
                        className={`${cellClass} ${coleta.base === 'gf' ? 'text-[#0e4b3b]' : ''}`}
                      >
                        {coleta.base === 'gf'
                          ? t('semaspa.coletas.base.gfShort')
                          : coleta.base === 'autef'
                            ? t('semaspa.coletas.base.autef')
                            : '—'}
                      </TableCell>
                      <TableCell className={`${cellClass} font-medium`}>{recorte}</TableCell>
                      <TableCell className="px-4 py-3">
                        <ColetaStatusBadge status={coleta.status} />
                      </TableCell>
                      <TableCell className={`${cellClass} font-medium`}>
                        {countLabel(coleta.status, coleta.contadores.gravados, formatNumber)}
                      </TableCell>
                      <TableCell className={`${cellClass} font-medium`}>
                        {countLabel(coleta.status, coleta.contadores.jaExistentes, formatNumber)}
                      </TableCell>
                      <TableCell
                        className={`${cellClass} font-medium ${failures > 0 && coleta.status !== 'queued' ? 'text-[#c2413b]' : ''}`}
                      >
                        {countLabel(coleta.status, failures, formatNumber)}
                      </TableCell>
                      <TableCell className={`${cellClass} font-medium`}>
                        {formatColetaDateTime(coleta.inicioEm)}
                      </TableCell>
                      <TableCell className={cellClass}>{coleta.solicitante?.name ?? '—'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <ListPaginationFooter
            borderClassName="border-[#e4e8e5]"
            textClassName="text-[#5c6b64]"
            pageSize={pageSize}
            pageSizeOptions={[20, 50, 100]}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            currentPage={currentPage}
            totalPages={totalPages}
            canPrev={currentPage > 1}
            canNext={currentPage < totalPages}
            onPageChange={setPage}
            isBusy={query.isFetching}
          />
        </div>
      </div>

      <NovaColetaPanel open={panelOpen} onOpenChange={setPanelOpen} />
    </div>
  );
}
