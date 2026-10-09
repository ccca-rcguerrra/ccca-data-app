import { useTranslation } from 'react-i18next';

import type { ColetaDocumentoResultado, ColetaStatus } from '@/types/semaspa';
import { cn } from '@/lib/utils';

const STATUS_TONE: Record<ColetaStatus, string> = {
  completed: 'bg-[#e7f0ec] text-[#0e4b3b]',
  completed_with_issues: 'bg-[#fbf0c4] text-[#6b5a12]',
  running: 'bg-[#e8eef5] text-[#1e3a5f]',
  queued: 'bg-[#eef1ef] text-[#5c6b64]',
  failed: 'bg-[#fbe9e7] text-[#c2413b]',
  cancelled: 'bg-[#eef1ef] text-[#5c6b64]',
};

const RESULT_TONE: Record<ColetaDocumentoResultado, string> = {
  gravado: 'bg-[#e7f0ec] text-[#0e4b3b]',
  ja_existente: 'bg-[#e7f0ec] text-[#0e4b3b]',
  sem_pdf: 'bg-[#fbf0c4] text-[#6b5a12]',
  em_andamento: 'bg-[#e8eef5] text-[#1e3a5f]',
  aguardando: 'bg-[#eef1ef] text-[#5c6b64]',
  falha: 'bg-[#fbe9e7] text-[#c2413b]',
};

function Pill({ className, label }: { className: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ColetaStatusBadge({ status }: { status: ColetaStatus }) {
  const { t } = useTranslation();
  return <Pill className={STATUS_TONE[status]} label={t(`semaspa.coletas.status.${status}`)} />;
}

export function ColetaResultBadge({ resultado }: { resultado: ColetaDocumentoResultado }) {
  const { t } = useTranslation();
  return (
    <Pill
      className={RESULT_TONE[resultado]}
      label={t(`semaspa.coletas.resultado.${resultado}`)}
    />
  );
}
