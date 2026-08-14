import { cn } from '@/lib/utils';

type StatusTone = 'over' | 'ok' | 'neutral';

function statusTone(status: string | null | undefined): StatusTone {
  const value = (status ?? '').toUpperCase();
  if (!value) return 'neutral';
  if (value.includes('CANCEL') || value.includes('ANULA')) return 'over';
  if (value.includes('UTILIZAD') || value.includes('RECEBID')) return 'ok';
  return 'neutral';
}

interface ForestGuideStatusBadgeProps {
  status: string | null | undefined;
}

export function ForestGuideStatusBadge({ status }: ForestGuideStatusBadgeProps) {
  if (!status) {
    return <span className="text-muted-foreground">—</span>;
  }

  const tone = statusTone(status);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium">
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          tone === 'over' && 'bg-status-over',
          tone === 'ok' && 'bg-status-ok',
          tone === 'neutral' && 'bg-muted-foreground',
        )}
      />
      {status}
    </span>
  );
}
