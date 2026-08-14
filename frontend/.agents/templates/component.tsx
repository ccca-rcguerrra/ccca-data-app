import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import { Loader2 } from 'lucide-react';

interface FeatureComponentProps {
  title: string;
  description?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
  children?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  actionLoading?: boolean;
}

export const FeatureComponent = ({
  title,
  description,
  isLoading = false,
  isError = false,
  errorMessage = 'Something went wrong',
  isEmpty = false,
  emptyMessage = 'No data found',
  className,
  children,
  onAction,
  actionLabel = 'Action',
  actionLoading = false,
}: FeatureComponentProps) => {
  if (isLoading) {
    return (
      <div className={cn('rounded-lg border p-6 space-y-4', className)}>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className={cn(
          'rounded-lg border border-destructive/50 bg-destructive/10 p-6',
          className,
        )}
      >
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed p-8 text-center',
          className,
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-card-foreground">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {onAction && (
          <Button
            size="sm"
            onClick={onAction}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
