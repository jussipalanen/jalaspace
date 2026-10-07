import {
  BookIcon,
  BuildingIcon,
  DashboardIcon,
  FileTextIcon,
  InboxIcon,
  LayoutGridIcon,
  SettingsIcon,
  UsersIcon,
  WrenchIcon,
} from '../components/icons'
import type { NavItem, NavSection } from '../types/navigation'

export const mainNavigation: NavSection[] = [
  {
    titleKey: 'nav.sections.overview',
    items: [{ labelKey: 'nav.items.dashboard', to: '/', icon: DashboardIcon, end: true }],
  },
  {
    titleKey: 'nav.sections.portfolio',
    items: [
      { labelKey: 'nav.items.properties', to: '/properties', icon: BuildingIcon },
      { labelKey: 'nav.items.spaces', to: '/units', icon: LayoutGridIcon },
    ],
  },
  {
    titleKey: 'nav.sections.operations',
    items: [{ labelKey: 'nav.items.maintenance', to: '/maintenance', icon: WrenchIcon }],
  },
  {
    titleKey: 'nav.sections.leasing',
    items: [
      { labelKey: 'nav.items.applications', to: '/applications', icon: InboxIcon, badge: 'newApplications' },
      { labelKey: 'nav.items.tenants', to: '/tenants', icon: UsersIcon },
      { labelKey: 'nav.items.leases', to: '/leases', icon: FileTextIcon },
    ],
  },
]

export const secondaryNavigation: NavItem[] = [
  { labelKey: 'nav.items.settings', to: '/settings', icon: SettingsIcon },
  { labelKey: 'nav.items.help', to: '/help', icon: BookIcon },
]
