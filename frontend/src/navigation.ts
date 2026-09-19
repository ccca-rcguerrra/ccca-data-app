import { Building2, FileSearch, FileText, Home, Trees, User, Users } from 'lucide-react';
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
      title: 'Indicator Center',
      titleKey: 'navigation.indicators',
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
      title: 'People',
      titleKey: 'navigation.people',
      url: '/semaspa/people',
      icon: Building2,
    },
    {
      title: 'Permit references',
      titleKey: 'navigation.permitReferences',
      url: '/semaspa/permit-references',
      icon: FileSearch,
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
