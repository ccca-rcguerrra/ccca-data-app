import { ReactNode } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number;
  children?: MenuItem[];
}

export interface UseSidebarProps {
  menuItems: MenuItem[];
}

export interface UseSidebarReturn {
  expandedItems: Set<string>;
  toggleExpanded: (itemId: string) => void;
  isActiveRoute: (path: string) => boolean;
}
