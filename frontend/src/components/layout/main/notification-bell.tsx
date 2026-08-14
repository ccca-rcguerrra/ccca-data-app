import { useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { buttonVariants } from '@/components/ui/shadcn/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/api/use-notifications';
import { ROUTES } from '@/constants/routes.constants';
import { formatISODateTime } from '@/utils/date';
import type { AppNotification } from '@/types/notifications';

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const notificationsQuery = useNotificationsQuery({ limit: 10 }, { enabled: open });
  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications: AppNotification[] = notificationsQuery.data?.data ?? [];

  const handleClick = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id);
    const alertId = n.data?.alertId;
    if (alertId) {
      setOpen(false);
      navigate(ROUTES.alerts.detail(alertId));
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'relative shrink-0')}
          aria-label="Notificações"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none"
              aria-hidden
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={6}>
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="px-0 font-normal text-muted-foreground">
            Notificações
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar todas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notificationsQuery.isLoading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Sem notificações
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n)}
                className={cn(
                  'flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-accent',
                  !n.readAt && 'bg-accent/40',
                )}
              >
                <div className="flex w-full items-center gap-2">
                  {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <span className="flex-1 truncate text-xs font-medium">{n.title}</span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatISODateTime(n.createdAt, undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <span className="line-clamp-2 pl-0 text-xs text-muted-foreground">{n.body}</span>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
