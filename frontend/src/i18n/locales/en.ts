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
    editProfile: 'Edit profile',
  },
  pages: {
    dashboard: {
      title: 'Dashboard',
      description: 'Overview of your property portfolio.',
    },
    properties: {
      title: 'Properties',
      description: 'Buildings and sites in your portfolio.',
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
    },
    propertyDetails: {
      title: 'Property details',
    },
    propertyNew: {
      title: 'Add property',
    },
    propertyEdit: {
      title: 'Edit property',
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
  common: {
    dismiss: 'Dismiss',
    required: 'required',
  },
  properties: {
    add: 'Add property',
    loadError: 'Unable to load properties.',
    search: {
      label: 'Search properties',
      placeholder: 'Name, address, postal code or city',
      clear: 'Clear search',
    },
    resultCount: { one: '{count} property', other: '{count} properties' },
    columns: {
      name: 'Name',
      address: 'Address',
      type: 'Type',
      spaces: 'Spaces',
      occupancy: 'Occupancy',
      openMaintenance: 'Open maintenance',
    },
    empty: {
      title: 'No properties yet',
      description: 'Add your first property to start managing its spaces and maintenance.',
    },
    noResults: {
      title: 'No properties match “{query}”',
      description: 'Try a different name, address, postal code or city.',
    },
    type: {
      office: 'Office',
      retail: 'Retail',
      industrial: 'Industrial',
      residential: 'Residential',
      mixed_use: 'Mixed use',
    },
    detail: {
      loadError: 'Unable to load the property.',
      notFoundTitle: 'Property not found',
      notFoundDescription: 'The property may have been deleted.',
      back: 'Back to properties',
      edit: 'Edit',
      delete: 'Delete',
      keyFigures: 'Key figures',
      details: 'Details',
      created: 'Added',
      updated: 'Last updated',
      noDescription: 'No description.',
      spaces: 'Spaces',
      noSpaces: 'This property has no spaces yet.',
      openMaintenance: 'Open maintenance',
      noOpenMaintenance: 'No open maintenance tasks.',
      spaceColumns: {
        name: 'Space',
        type: 'Type',
        floor: 'Floor',
        area: 'Area',
        status: 'Status',
      },
    },
    form: {
      createTitle: 'Add property',
      createDescription: 'Add a building or site to your portfolio.',
      editTitle: 'Edit property',
      editDescription: 'Update the details of {name}.',
      requiredHint: 'Fields marked with * are required.',
      fields: {
        name: 'Name',
        type: 'Type',
        address: 'Street address',
        postalCode: 'Postal code',
        city: 'City',
        description: 'Description',
      },
      hints: {
        postalCode: '5 digits, e.g. 80100',
        description: 'Optional, at most {max} characters',
      },
      save: 'Save property',
      saving: 'Saving…',
      cancel: 'Cancel',
      saveError: 'Unable to save the property. Please try again.',
      errorSummary: 'Please correct the highlighted fields.',
      validation: {
        name: { required: 'Name is required.', tooLong: 'Name can be at most {max} characters.' },
        address: { required: 'Street address is required.' },
        postalCode: {
          required: 'Postal code is required.',
          invalid: 'Enter a 5-digit postal code.',
        },
        city: { required: 'City is required.' },
        description: { tooLong: 'Description can be at most {max} characters.' },
      },
    },
    delete: {
      title: 'Delete {name}?',
      description: 'The property will be deleted permanently. This cannot be undone.',
      confirm: 'Delete property',
      deleting: 'Deleting…',
      cancel: 'Cancel',
      blockedTitle: '{name} cannot be deleted',
      blockedDescription:
        'Other data still refers to this property. Remove or move the following first:',
      blockedSpaces: { one: '{count} space', other: '{count} spaces' },
      blockedMaintenance: { one: '{count} maintenance task', other: '{count} maintenance tasks' },
      close: 'Close',
      error: 'Unable to delete the property. Please try again.',
    },
    flash: {
      created: 'Property {name} was added.',
      updated: 'Changes to {name} were saved.',
      deleted: 'Property {name} was deleted.',
    },
  },
  settings: {
    otherSections: 'Password and demo data settings are coming soon.',
    profile: {
      title: 'Profile',
      description: 'Your name and details shown in JalaSpace.',
      email: 'Email',
      emailHint: 'Used for signing in and cannot be changed.',
      firstName: 'First name',
      lastName: 'Last name',
      birthDate: 'Birthdate',
      birthDateHint: 'Optional. Choose the day, month and year.',
      day: 'Day',
      month: 'Month',
      year: 'Year',
      notSelected: '–',
      save: 'Save profile',
      saving: 'Saving…',
      saveError: 'Unable to save the profile. Please try again.',
      errorSummary: 'Please correct the highlighted fields.',
      saved: 'Your profile was saved.',
      validation: {
        firstName: {
          required: 'First name is required.',
          tooLong: 'First name can be at most {max} characters.',
        },
        lastName: {
          required: 'Last name is required.',
          tooLong: 'Last name can be at most {max} characters.',
        },
        birthDate: {
          incomplete: 'Choose the day, month and year, or leave all three empty.',
          invalid: 'This date does not exist.',
          future: 'The birthdate cannot be in the future.',
        },
      },
    },
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
