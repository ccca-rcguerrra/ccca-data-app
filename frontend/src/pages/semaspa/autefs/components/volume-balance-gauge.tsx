import { cn } from '@/lib/utils';

interface VolumeBalanceGaugeProps {
  ratio: number | null;
  className?: string;
  compact?: boolean;
}

/**
 * Volume moved/authorized gauge. The 100% tick stays fixed; fill past it
 * is the over-extraction signal (the evidence, not a clipped progress bar).
 */
export function VolumeBalanceGauge({
  ratio,
  className,
  compact = false,
}: VolumeBalanceGaugeProps) {
  if (ratio == null || Number.isNaN(ratio)) {
    return (
      <span className={cn('text-xs tabular-nums text-muted-foreground', className)}>—</span>
    );
  }

  const pct = ratio * 100;
  const isOver = ratio > 1;
  const isWatch = ratio >= 0.8 && !isOver;
  const scaleMax = Math.max(1, ratio);
  const fillPct = (ratio / scaleMax) * 100;
  const tickPct = (1 / scaleMax) * 100;

  const fillClass = isOver
    ? 'bg-status-over'
    : isWatch
      ? 'bg-brand-yellow'
      : 'bg-status-ok';

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-full bg-muted',
          compact ? 'h-1.5 w-16' : 'h-1.5 w-24',
        )}
      >
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full', fillClass)}
          style={{ width: `${fillPct}%` }}
        />
        {isOver ? (
          <div
            aria-hidden
            className="absolute top-1/2 z-10 h-2.5 w-px -translate-y-1/2 bg-foreground"
            style={{ left: `${tickPct}%` }}
          />
        ) : null}
      </div>
      <span
        className={cn(
          'shrink-0 text-xs tabular-nums font-medium',
          isOver ? 'text-status-over' : 'text-foreground',
        )}
      >
        {pct.toLocaleString(undefined, { maximumFractionDigits: 1 })}%
      </span>
    </div>
  );
}
