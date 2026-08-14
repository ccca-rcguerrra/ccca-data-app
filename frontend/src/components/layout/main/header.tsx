import { useMemo } from "react"
import { Search, Moon, Sun, LogOut, Users } from "lucide-react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { formatUserRolesDisplay } from "@/constants/user-roles.constants"

import { Button, buttonVariants } from "@/components/ui/shadcn/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/shadcn/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/shadcn/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/shadcn/sidebar"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useSettingsStore } from '@/stores'
import { useAuth } from "@/hooks/api/use-auth"
import { useOnlineUsersQuery } from "@/hooks/api/use-users"
import { useNotificationEvents } from "@/hooks/websocket/use-notification-events"
import { ROUTES } from '@/constants/routes.constants';
import { NotificationBell } from './notification-bell'
import style from './header.module.scss'

function OnlineUsersMenu() {
  const { t } = useTranslation();
  const { data: onlineUsers = [] } = useOnlineUsersQuery();

  if (onlineUsers.length === 0) return null;

  const count = onlineUsers.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "relative shrink-0"
          )}
          aria-label={t("header.onlineUsersTriggerAria", { count })}
        >
          <Users className="size-4" />
          <span
            className="bg-primary text-primary-foreground absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none"
            aria-hidden
          >
            {count > 99 ? "99+" : count}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72" align="end" sideOffset={6}>
        <DropdownMenuLabel className="text-muted-foreground font-normal">
          {t("header.onlineUsersMenuTitle", { count })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {onlineUsers.map((user) => (
            <DropdownMenuItem
              key={user.id}
              className="cursor-default py-2"
              onSelect={(e) => e.preventDefault()}
            >
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={user.photo ?? undefined} alt="" />
                <AvatarFallback className="text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium leading-tight">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs leading-tight">
                  {user.email}
                </span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface HeaderProps {
  title?: string;
  user?: {
    name: string;
    email: string;
    avatar: string;
  };
  onMenuToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header = ({ title = "", user, onMenuToggle, isSidebarCollapsed }: HeaderProps) => {
  const { t } = useTranslation();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const { user: authUser, logout } = useAuth();
  const navigate = useNavigate();

  // Global listener for the current user's notification room (router context required).
  useNotificationEvents();

  const defaultUser = {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  };

  // Use auth user if available, otherwise use prop user, otherwise default
  const currentUser = authUser 
    ? {
        name: authUser.name,
        email: authUser.email,
        avatar: authUser.photo || "/avatars/default.jpg",
      }
    : user || defaultUser;

  const rolesDisplay = useMemo(
    () => formatUserRolesDisplay(authUser?.roles, t),
    [authUser?.roles, t]
  );

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.auth.login, { replace: true });
  };

  const isDarkMode = theme === 'dark';

  return (
    <header className={`${style.header} flex shrink-0 items-center gap-2`}>
      <SidebarTrigger 
        className="-ml-1" 
        onClick={onMenuToggle}
        aria-label={isSidebarCollapsed ? t('layout.header.expandSidebar') : t('layout.header.collapseSidebar')}
      />
      
      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('layout.header.searchPlaceholder')}
          className="w-[28.75rem] pl-8"
          style={{ borderRadius: '40px', backgroundColor: 'var(--color-neutral-100)' }}
        />
      </div>
      
      <div className="min-w-0 flex-1" />

      <div className="flex shrink-0 items-center gap-2">
        <NotificationBell />
        <OnlineUsersMenu />
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleTheme}
          aria-label={isDarkMode ? t('layout.header.switchToLightMode') : t('layout.header.switchToDarkMode')}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(buttonVariants({ variant: "ghost" }), "relative h-8 w-8 rounded-full")}
              aria-label={t("header.userMenuAria", { name: currentUser.name })}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser.email}
                </p>
                {rolesDisplay && (
                  <p className="text-xs leading-snug text-primary pt-0.5">
                    <span className="text-muted-foreground">{t("header.userRole")}: </span>
                    {rolesDisplay}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {t('layout.header.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('layout.header.logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
