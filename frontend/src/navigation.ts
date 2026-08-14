import { FileText, Home, Trees, User, Users } from 'lucide-react';
import type { Permission } from '@/constants/permissions';

export interface NavItem {
  title: string;
  titleKey?: string;
  url: string;
  icon?: React.ElementType;
  iconColor?: string;
  isActive?: boolean;
  permission?: Permission;
  items?: { title: string; url: string }[];
}

export const navigationData = {
  teams: [],
  navMain: [
    {
      title: 'Dashboard',
      titleKey: 'navigation.dashboard',
      url: '/',
      icon: Home,
      isActive: true,
    },
    {
      title: 'AUTEFs',
      titleKey: 'navigation.autefs',
      url: '/semaspa/autefs',
      icon: FileText,
    },
    {
      title: 'Forest Guides',
      titleKey: 'navigation.forestGuides',
      url: '/semaspa/forest-guides',
      icon: Trees,
    },
    {
      title: 'Users',
      titleKey: 'navigation.users',
      url: '/users',
      icon: User,
      permission: 'users.manage' as Permission,
    },
    {
      title: 'Teams',
      titleKey: 'navigation.teams',
      url: '/teams',
      icon: Users,
      permission: 'teams.manage' as Permission,
    },
  ],
  projects: [],
};
