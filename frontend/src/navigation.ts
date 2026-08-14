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
      iconColor: 'text-[#515050]',
      isActive: true,
    },
    {
      title: 'AUTEFs',
      titleKey: 'navigation.autefs',
      url: '/semaspa/autefs',
      icon: FileText,
      iconColor: 'text-[#4a7c59]',
    },
    {
      title: 'Forest Guides',
      titleKey: 'navigation.forestGuides',
      url: '/semaspa/forest-guides',
      icon: Trees,
      iconColor: 'text-[#3d6b4f]',
    },
    {
      title: 'Users',
      titleKey: 'navigation.users',
      url: '/users',
      icon: User,
      iconColor: 'text-[#5c7d92]',
      permission: 'users.manage' as Permission,
    },
    {
      title: 'Teams',
      titleKey: 'navigation.teams',
      url: '/teams',
      icon: Users,
      iconColor: 'text-[#6ba5c4]',
      permission: 'teams.manage' as Permission,
    },
  ],
  projects: [],
};
