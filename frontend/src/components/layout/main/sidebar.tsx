import { useState } from "react"
import { useNavigate, useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import {
  ChevronRight,
  ChevronsUpDown,
  Plus,
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  Home,
  Users,
  Database,
  AlertTriangle,
  HelpCircle,
  type LucideIcon
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/shadcn/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/shadcn/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/shadcn/sidebar"

import { navigationData } from "@/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { useFeatures } from "@/hooks/api/use-app-config"

// Configuration flags
const CONFIG = {
  // Temporarily disable team menu - can be enabled in the future
  ENABLE_TEAM_MENU: false,
  // Temporarily disable user menu in sidebar footer - can be enabled in the future
  ENABLE_NAV_USER: false,
};


// Team Switcher Component
const TeamSwitcher = ({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) => {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeTeam.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

// Navigation Main Component
const NavMain = ({
  items,
}: {
    items: {
      title: string;
      titleKey?: string;
      url: string;
    icon?: LucideIcon;
    iconColor?: string;
    isActive?: boolean;
    items?: {
        title: string;
        titleKey?: string;
        url: string;
    }[];
  }[];
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const isActiveRoute = (url: string) => {
    // Special case for root path: only match exact path
    if (url === '/') {
      return location.pathname === '/';
    }
    // For other paths, match exact or sub-paths
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <SidebarGroup>
      <SidebarMenu className="cursor-pointer">
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0;
          const itemTitle = item.titleKey ? t(item.titleKey) : item.title;

          if (hasChildren) {
            // Item with children - use Collapsible
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="cursor-pointer"
                      tooltip={itemTitle}
                      isActive={isActiveRoute(item.url)}
                    >
                      {item.icon && <item.icon className={`size-5 group-data-[collapsible=icon]:size-5 ${item.iconColor ?? ''}`} />}
                      <span>{itemTitle}</span>
                      <ChevronRight className="ml-auto size-6 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem className="cursor-pointer" key={subItem.title}>
                          <SidebarMenuSubButton
                            onClick={() => handleNavigation(subItem.url)}
                            isActive={isActiveRoute(subItem.url)}
                          >
                            <span>{subItem.titleKey ? t(subItem.titleKey) : subItem.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            // Item without children - simple button
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  className="cursor-pointer"
                  tooltip={itemTitle}
                  onClick={() => handleNavigation(item.url)}
                  isActive={isActiveRoute(item.url)}
                >
                  {item.icon && <item.icon className={`size-5 group-data-[collapsible=icon]:size-5 ${item.iconColor ?? ''}`} />}
                  <span>{itemTitle}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
};

// Navigation Projects Component
const NavProjects = ({
  projects,
}: {
  projects: {
    name: string;
    url: string;
    icon: LucideIcon;
  }[];
}) => {
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (url: string) => {
    navigate(url);
  };

  const isActiveRoute = (url: string) => {
    // Special case for root path: only match exact path
    if (url === '/') {
      return location.pathname === '/';
    }
    // For other paths, match exact or sub-paths
    return location.pathname === url || location.pathname.startsWith(url + '/');
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name} className="group relative">
            <SidebarMenuButton
              onClick={() => handleNavigation(item.url)}
              isActive={isActiveRoute(item.url)}
            >
              <item.icon className="size-5 group-data-[collapsible=icon]:size-5" />
              <span>{item.name}</span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
};

// Navigation User Component
const NavUser = ({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) => {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onHover?: (hovered: boolean) => void;
  isManuallyCollapsed?: boolean;
}

// Toggle to re-enable sidebar expand/collapse on hover when manually collapsed
const enableHoverExpand = false;

export const AppSidebar = ({ isCollapsed = false, onToggle, onHover, isManuallyCollapsed = false, ...props }: AppSidebarProps & React.ComponentProps<typeof Sidebar>) => {
  const { state } = useSidebar();
  const { can } = usePermissions();
  const features = useFeatures();

  const visibleNavItems = navigationData.navMain.filter(
    (item) =>
      (!item.permission || can(item.permission)) &&
      (!item.feature || features[item.feature] === true),
  );
  const isCollapsedState = state === 'collapsed';

  const handleMouseEnter = () => {
    if (enableHoverExpand && onHover && isManuallyCollapsed) onHover(false);
  };

  const handleMouseLeave = () => {
    if (enableHoverExpand && onHover && isManuallyCollapsed) onHover(true);
  };

  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={enableHoverExpand ? handleMouseEnter : undefined}
      onMouseLeave={enableHoverExpand ? handleMouseLeave : undefined}
      {...props}
    >
      <SidebarHeader>
        <div className={`relative flex items-center justify-center transition-all duration-200 ${isCollapsedState ? 'px-0 py-2' : 'gap-2 px-2 py-3'} group-data-[collapsible=icon]:justify-center`}>
          <img
              src={isCollapsedState ? '/images/ccca-logo-mark-64.png' : '/images/ccca-logo-web.png'}
              srcSet={isCollapsedState ? '/images/ccca-logo-mark-64.png 1x, /images/ccca-logo-mark.png 2x' : undefined}
              alt="CCCA"
              draggable={false}
              className={
                isCollapsedState
                  ? 'size-8 shrink-0 object-contain'
                  : 'h-10 w-auto max-w-[155px] shrink-0 object-contain'
              }
            />
        </div>
        {/* Team menu temporarily disabled - set CONFIG.ENABLE_TEAM_MENU to true to enable */}
        {CONFIG.ENABLE_TEAM_MENU && (
          <TeamSwitcher teams={navigationData.teams} />
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleNavItems} />
        {navigationData.projects.length > 0 && (
          <NavProjects projects={navigationData.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
