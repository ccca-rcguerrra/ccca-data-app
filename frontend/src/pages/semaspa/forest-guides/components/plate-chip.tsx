import { cn } from '@/lib/utils';

interface PlateChipProps {
  plates: string[] | null | undefined;
  maxVisible?: number;
  className?: string;
}

/**
 * Vehicle plate tokens. The physical identifier of a timber shipment —
 * rendered as a plate, not a comma-separated string.
 */
export function PlateChip({ plates, maxVisible = 3, className }: PlateChipProps) {
  const list = (plates ?? []).map((plate) => plate.trim()).filter(Boolean);

  if (list.length === 0) {
    return <span className={cn('text-muted-foreground', className)}>—</span>;
  }

  const visible = list.slice(0, maxVisible);
  const extra = list.length - visible.length;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {visible.map((plate) => (
        <span
          key={plate}
          className="inline-flex items-center rounded-sm border border-border bg-muted/50 px-1.5 py-0.5 font-mono text-xs uppercase tracking-wide"
        >
          {plate}
        </span>
      ))}
      {extra > 0 ? (
        <span className="inline-flex items-center rounded-sm border border-border bg-muted/50 px-1.5 py-0.5 text-xs text-muted-foreground">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
