/**
 * English messages: the source of truth for translation keys.
 * Placeholders use `{name}`; plural messages have `one` and `other` forms.
 */
export const en = {
  app: {
    name: 'JalaSpace',
    documentTitle: '{page} · JalaSpace',
    demoBadge: 'Demo',
    skipToContent: 'Skip to content',
  },
  language: {
    label: 'Language',
  },
  nav: {
    sidebar: 'Sidebar',
    main: 'Main navigation',
    open: 'Open navigation',
    close: 'Close navigation',
    demoNote: 'Demo environment. Data is stored only in this browser.',
    sections: {
      overview: 'Overview',
      portfolio: 'Portfolio',
      operations: 'Operations',
      leasing: 'Leasing',
    },
    items: {
      dashboard: 'Dashboard',
      properties: 'Properties',
      spaces: 'Spaces',
      maintenance: 'Maintenance',
      tenants: 'Tenants',
      leases: 'Leases',
      settings: 'Settings',
    },
  },
  header: {
    signOut: 'Sign out',
  },
  pages: {
    dashboard: {
      title: 'Dashboard',
      description: 'Overview of your property portfolio.',
    },
    properties: {
      title: 'Properties',
      description: 'Buildings and sites in your portfolio.',
      comingSoonTitle: 'Property management is coming soon',
      comingSoonDescription: 'You will be able to add, search and manage properties here.',
    },
    spaces: {
      title: 'Spaces',
      description: 'Units and rentable spaces across all properties.',
      comingSoonTitle: 'Space management is coming soon',
      comingSoonDescription:
        'You will be able to filter spaces by property and status, and track availability here.',
    },
    maintenance: {
      title: 'Maintenance',
      description: 'Track and resolve maintenance tasks across your properties.',
      comingSoonTitle: 'Maintenance tasks are coming soon',
      comingSoonDescription:
        'You will be able to create, prioritise and complete maintenance tasks here.',
    },
    tenants: {
      title: 'Tenants',
      description: 'Companies and people renting your spaces.',
      comingSoonTitle: 'Tenant management is coming soon',
      comingSoonDescription:
        'You will be able to manage tenants and assign them to spaces here.',
    },
    leases: {
      title: 'Leases',
      description: 'Lease agreements between tenants and spaces.',
      comingSoonTitle: 'Lease management is coming soon',
      comingSoonDescription: 'You will be able to manage lease periods, rents and statuses here.',
    },
    settings: {
      title: 'Settings',
      description: 'Application and demo environment settings.',
      comingSoonTitle: 'Settings are coming soon',
      comingSoonDescription: 'Demo data reset and other preferences will be available here.',
    },
    propertyDetails: {
      title: 'Property details',
      comingSoonTitle: 'Property details are coming soon',
      back: 'Back to properties',
    },
    maintenanceDetails: {
      title: 'Maintenance task details',
      comingSoonTitle: 'Maintenance task details are coming soon',
      back: 'Back to maintenance',
    },
    tenantDetails: {
      title: 'Tenant details',
      comingSoonTitle: 'Tenant details are coming soon',
      back: 'Back to tenants',
    },
    details: {
      reference: 'Reference: {id}',
      comingSoonDescription: 'Detailed information will be shown here once data is connected.',
    },
    notFound: {
      title: 'Page not found',
      description: 'The page you are looking for does not exist or has been moved.',
      action: 'Go to dashboard',
    },
    error: {
      title: 'Something went wrong',
      description: 'This page could not be displayed. Please try again.',
      action: 'Reload page',
    },
  },
  auth: {
    signIn: 'Sign in',
    subtitle: 'Property and space management demo',
    email: 'Email',
    password: 'Password',
    submitting: 'Signing in…',
    demoAccount: 'Demo account',
    fillDemo: 'Fill in demo credentials',
    notice:
      'This is a demo. Sign-in is simulated in your browser and is not secure. Data is stored only in this browser.',
    invalidCredentials: 'Invalid email or password.',
    unavailable: 'Unable to sign in. Please try again.',
    validation: {
      email: {
        required: 'Email is required.',
        invalid: 'Enter a valid email address.',
      },
      password: {
        required: 'Password is required.',
      },
    },
  },
  states: {
    loading: 'Loading…',
    retryHint: 'Please try again.',
    retry: 'Try again',
  },
  dashboard: {
    loading: 'Loading dashboard…',
    loadError: 'Unable to load the dashboard.',
    keyFigures: 'Key figures',
    stats: {
      properties: 'Properties',
      inCities: { one: 'In {count} city', other: 'In {count} cities' },
      spaces: 'Spaces',
      available: '{count} available',
      occupancy: 'Occupancy',
      spacesOccupied: {
        one: '{occupied} of {count} space occupied',
        other: '{occupied} of {count} spaces occupied',
      },
      openMaintenance: 'Open maintenance',
      highPriority: { one: '{count} high priority', other: '{count} high priority' },
    },
    recentMaintenance: {
      title: 'Recent maintenance',
      empty: 'No maintenance tasks yet.',
      due: 'Due {date}',
    },
    availableSpaces: {
      title: 'Available spaces',
      empty: 'All spaces are occupied or in maintenance.',
      reservedFrom: 'Reserved from {date}',
      floor: 'Floor {floor}',
    },
    activity: {
      title: 'Recent activity',
      empty: 'No activity yet.',
      types: {
        maintenance_completed: 'Maintenance task completed',
        lease_started: 'Lease started',
        lease_ended: 'Lease ended',
      },
    },
    viewAll: 'View all',
    viewAllCount: 'View all {count}',
  },
  maintenance: {
    status: {
      open: 'Open',
      in_progress: 'In progress',
      completed: 'Completed',
    },
    priority: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    },
    priorityAccessible: '{priority} priority',
  },
  space: {
    status: {
      available: 'Available',
      occupied: 'Occupied',
      maintenance: 'Maintenance',
    },
    type: {
      office: 'Office',
      retail: 'Retail',
      industrial: 'Industrial',
      storage: 'Storage',
      apartment: 'Apartment',
    },
  },
}

export type Messages = typeof en
