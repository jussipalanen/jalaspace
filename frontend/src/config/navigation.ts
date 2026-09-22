import {
  BuildingIcon,
  DashboardIcon,
  FileTextIcon,
  LayoutGridIcon,
  SettingsIcon,
  UsersIcon,
  WrenchIcon,
} from '../components/icons'
import type { NavItem, NavSection } from '../types/navigation'

export const mainNavigation: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/', icon: DashboardIcon, end: true }],
  },
  {
    title: 'Portfolio',
    items: [
      { label: 'Properties', to: '/properties', icon: BuildingIcon },
      { label: 'Spaces', to: '/units', icon: LayoutGridIcon },
    ],
  },
  {
    title: 'Operations',
    items: [{ label: 'Maintenance', to: '/maintenance', icon: WrenchIcon }],
  },
  {
    title: 'Leasing',
    items: [
      { label: 'Tenants', to: '/tenants', icon: UsersIcon },
      { label: 'Leases', to: '/leases', icon: FileTextIcon },
    ],
  },
]

export const secondaryNavigation: NavItem[] = [
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
]
