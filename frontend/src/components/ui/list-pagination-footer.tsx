import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Button, buttonVariants } from '@/components/ui/shadcn/button';

interface ListPaginationFooterProps {
  leftContent?: React.ReactNode;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  canPrev: boolean;
  canNext: boolean;
  onPageChange: (page: number) => void;
  isBusy?: boolean;
  borderClassName?: string;
  textClassName?: string;
}

export function ListPaginationFooter({
  leftContent,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  currentPage,
  totalPages,
  canPrev,
  canNext,
  onPageChange,
  isBusy = false,
  borderClassName = 'border-border',
  textClassName = 'text-muted-foreground',
}: ListPaginationFooterProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-t shrink-0', borderClassName)}>
      <div className={cn('hidden flex-1 text-sm lg:flex', textClassName)}>{leftContent}</div>
      <div className="flex w-full items-center gap-6 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-sm font-medium">{t('common.rowsPerPage')}</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 w-20')}
              disabled={isBusy}
            >
              {pageSize}
              <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {pageSizeOptions.map((n) => (
                <DropdownMenuItem key={n} onClick={() => onPageSizeChange(n)}>
                  {n}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className={cn('flex w-fit items-center justify-center text-sm font-medium', textClassName)}>
          {t('common.page')} {currentPage} {t('common.of')} {totalPages}
        </div>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:flex"
            onClick={() => onPageChange(1)}
            disabled={!canPrev || isBusy}
            aria-label={t('common.firstPage')}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!canPrev || isBusy}
            aria-label={t('common.previousPage')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!canNext || isBusy}
            aria-label={t('common.nextPage')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext || isBusy}
            aria-label={t('common.lastPage')}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
