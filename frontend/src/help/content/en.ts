import type { Handbook } from '../types'

/**
 * The user handbook in English. Button, field and page names are written in
 * **bold** exactly as the English UI shows them.
 */
export const en: Handbook = {
  'getting-started': {
    title: 'Getting started',
    summary: 'Sign in, find your way around and choose your language.',
    sections: {
      'sign-in': {
        title: 'Signing in',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpace is a demo for managing properties, rentable spaces, tenants, leases, rental applications and maintenance. Sign in with the demo account shown on the sign-in page.',
          },
          {
            type: 'steps',
            items: [
              'Select **Fill in demo credentials**, or type the email and password shown under **Demo account**.',
              'Select **Sign in**. The **Dashboard** opens, or the page you were trying to open.',
            ],
          },
          {
            type: 'paragraph',
            text: 'To sign out, select the sign-out button at the right end of the top bar.',
          },
          {
            type: 'note',
            text: 'This is a demo with fictional data and simulated sign-in. Never enter real personal information.',
          },
        ],
      },
      navigation: {
        title: 'Finding your way around',
        blocks: [
          {
            type: 'paragraph',
            text: 'The sidebar on the left lists every area of the app, grouped by topic: **Overview**, **Portfolio**, **Operations** and **Leasing**. **Settings** and this **Handbook** are at the bottom.',
          },
          {
            type: 'list',
            items: [
              'On a phone or a narrow window the sidebar is hidden. Open it with the menu button at the left end of the top bar, and close it with the close button or the Escape key.',
              'The number next to **Applications** tells how many new applications are waiting.',
              'Select the **?** button in the top bar to open the handbook chapter for the page you are on.',
              'Your name in the top bar opens your profile in **Settings**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Lists have a search field and filters above them. The filters are kept in the page address, so you can reload the page, bookmark it or share the link and see the same results.',
          },
        ],
      },
      language: {
        title: 'Language',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpace is available in English and Finnish. Choose the language from the **Language** selector in the top bar, on the sign-in page or in **Settings**. The page changes immediately and stays where it is.',
          },
          {
            type: 'paragraph',
            text: 'Your choice is remembered in this browser. Names, addresses and other text entered by users are shown as they were written, so the demo data stays in English.',
          },
        ],
      },
      'demo-data': {
        title: 'The demo data',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpace starts with a fictional portfolio: properties in several Finnish cities, with their spaces, tenants, leases, applications and maintenance tasks. You can change anything, add your own records and delete them.',
          },
          {
            type: 'paragraph',
            text: 'The note at the bottom of the sidebar tells where your changes are saved: only in this browser, or on a server shared by everyone who uses the demo.',
          },
          {
            type: 'paragraph',
            text: 'To start over, reset the demo data in **Settings**. See the Settings chapter.',
          },
        ],
      },
    },
  },

  dashboard: {
    title: 'Dashboard',
    summary: 'The key figures of your portfolio and what needs attention.',
    sections: {
      'key-figures': {
        title: 'Key figures',
        blocks: [
          {
            type: 'paragraph',
            text: 'The **Dashboard** opens after you sign in. The key figures at the top are calculated from your data:',
          },
          {
            type: 'list',
            items: [
              '**Properties**: how many properties you have and in how many cities.',
              '**Spaces**: all spaces, split into occupied, available, reserved (an upcoming lease exists) and in maintenance.',
              '**Occupancy**: the share of spaces that are occupied.',
              '**Open maintenance**: tasks that are not completed, by priority.',
              '**Open applications**: new applications and those in review.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Select a figure to open the matching list.',
          },
        ],
      },
      lists: {
        title: 'What needs attention',
        blocks: [
          {
            type: 'paragraph',
            text: 'Below the key figures, the Dashboard shows short lists. Each item links to its page, and **View all** opens the full list.',
          },
          {
            type: 'list',
            items: [
              '**Recent maintenance**: the latest tasks with their priority and due date.',
              '**Available spaces**: spaces that can be let now, with the number of applications for each. A space with an upcoming lease is marked as reserved.',
              '**Latest applications**: the five newest applications and their status.',
              '**Recent activity**: completed maintenance, leases that started or ended, and received and approved applications.',
            ],
          },
        ],
      },
      ask: {
        title: 'Ask JalaSpace',
        blocks: [
          {
            type: 'paragraph',
            text: 'When the AI features are available, the Dashboard has an **Ask JalaSpace** card. Ask a question in English or Finnish, and it shows where to go in the app or which records match.',
          },
          {
            type: 'list',
            items: [
              '"Where can I change the language?" links to the right page.',
              '"An available three-room apartment with a sauna" lists the matching spaces.',
              '"Overdue high-priority maintenance tasks" lists the matching tasks.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Before your first question the card offers a few examples under **Try asking**; select one to ask it. The answer shows how your question was **Understood as**, as conditions. Remove a condition to widen the search, and select **Open in** to see the results on their list page.',
          },
          {
            type: 'note',
            text: 'Your question is sent to Google Gemini, so do not include personal information. The AI only interprets the question: the results come from JalaSpace\'s own data.',
          },
        ],
      },
    },
  },

  properties: {
    title: 'Properties',
    summary: 'Buildings and sites, with their spaces, maintenance and location.',
    sections: {
      list: {
        title: 'The property list',
        blocks: [
          {
            type: 'paragraph',
            text: '**Properties** lists your buildings and sites with their address, type, number of spaces, occupancy and open maintenance tasks.',
          },
          {
            type: 'paragraph',
            text: 'Use **Search properties** to find a property by name, address, postal code or city. Select a property\'s name to open its details.',
          },
          { type: 'link', to: '/properties', label: 'Open Properties' },
        ],
      },
      details: {
        title: 'Property details',
        blocks: [
          {
            type: 'paragraph',
            text: 'A property\'s page gathers everything about it:',
          },
          {
            type: 'list',
            items: [
              '**Key figures**: spaces, occupancy and open maintenance.',
              '**Spaces**: every space with its type, floor, area, rooms, status and current tenant. **Add space** creates a new space in this property.',
              '**Open maintenance**: the tasks that are not completed. **Add task** creates a task for this property.',
              '**Location**: the property on a map, if a location has been set.',
            ],
          },
          {
            type: 'paragraph',
            text: 'An available space that people can apply for has an **Application form** link, which opens its public application form in a new tab.',
          },
        ],
      },
      'add-edit': {
        title: 'Adding and editing a property',
        blocks: [
          {
            type: 'steps',
            items: [
              'On the **Properties** page, select **Add property**. To change an existing property, open it and select **Edit**.',
              'Fill in the **Name**, **Type**, **Street address**, **Postal code** and **City**. Fields marked with * are required.',
              'Optionally add a **Description** and set the **Location**.',
              'Select **Save property**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The postal code has five digits, for example 80100. If something is missing or invalid, the form points out the fields to correct.',
          },
        ],
      },
      location: {
        title: 'Setting the location',
        blocks: [
          {
            type: 'paragraph',
            text: 'The location is optional. It is set in the property form, and the details page shows it on a map.',
          },
          {
            type: 'steps',
            items: [
              'In the **Search address** field, check the address. It is filled in from the address fields.',
              'Select **Search** or press Enter, then choose the right place under **Matches**. The pin moves there.',
              'To fine-tune, drag the pin or click the map. You can also type the **Latitude** and **Longitude**.',
              'Zoom the map to the level you want: it is saved with the location.',
            ],
          },
          {
            type: 'paragraph',
            text: '**Clear location** removes the location. On the details page, **Open in OpenStreetMap** shows the place on OpenStreetMap\'s website.',
          },
          {
            type: 'note',
            text: 'The address search covers Finland only, and the address you search for is sent to OpenStreetMap.',
          },
        ],
      },
      delete: {
        title: 'Deleting a property',
        blocks: [
          {
            type: 'paragraph',
            text: 'Open the property and select **Delete**, then confirm with **Delete property**. Deleting cannot be undone.',
          },
          {
            type: 'paragraph',
            text: 'A property that still has spaces or maintenance tasks cannot be deleted. JalaSpace tells what refers to it, so you can remove or move those first.',
          },
        ],
      },
    },
  },

  spaces: {
    title: 'Spaces',
    summary: 'Apartments, offices and other rentable spaces in your properties.',
    sections: {
      list: {
        title: 'Finding spaces',
        blocks: [
          {
            type: 'paragraph',
            text: '**Spaces** lists the rentable spaces of all properties with their property, type, floor, area, rooms, status and current tenant.',
          },
          {
            type: 'list',
            items: [
              '**Search spaces** finds a space by its name or its tenant\'s name.',
              'Filter by **Property**, **Status** and **Rooms** (1–4, or 5 or more).',
              'Under **Features**, choose the features a space must have, for example a sauna and a balcony. A space must have every chosen feature.',
              '**Clear filters** shows all spaces again.',
            ],
          },
          { type: 'link', to: '/units', label: 'Open Spaces' },
        ],
      },
      'add-edit': {
        title: 'Adding and editing a space',
        blocks: [
          {
            type: 'steps',
            items: [
              'Select **Add space** on the **Spaces** page, or on a property\'s page, where the property is already chosen. To change a space, select its name in the list.',
              'Choose the **Property** and fill in the **Name**, **Type**, **Floor** and **Area (m²)**.',
              'Optionally add the number of **Rooms** and the **Features**.',
              'Select **Save space**.',
            ],
          },
          {
            type: 'list',
            items: [
              'The name must be unique within the property, for example A 101.',
              'The floor is a whole number; use −1 for a basement.',
              'The area may have decimals, for example 62.5.',
            ],
          },
        ],
      },
      status: {
        title: 'Status',
        blocks: [
          {
            type: 'paragraph',
            text: 'A space is **Available**, **Occupied** or in **Maintenance**.',
          },
          {
            type: 'list',
            items: [
              'A space is occupied while it has an active lease. JalaSpace sets this automatically when a lease starts and ends, and the status cannot be changed by hand meanwhile.',
              'Otherwise you choose between available and maintenance, for example during a renovation.',
              'The form of an occupied space shows its tenant, with links to the tenant and the lease.',
            ],
          },
        ],
      },
      delete: {
        title: 'Deleting a space',
        blocks: [
          {
            type: 'paragraph',
            text: 'Open the space and select **Delete space** at the bottom of the form, then confirm. Deleting cannot be undone.',
          },
          {
            type: 'paragraph',
            text: 'A space cannot be deleted while leases, maintenance tasks or applications refer to it. JalaSpace lists them, so you can handle them first.',
          },
        ],
      },
    },
  },

  maintenance: {
    title: 'Maintenance',
    summary: 'Record repairs and inspections, and follow them until they are done.',
    sections: {
      list: {
        title: 'The task list',
        blocks: [
          {
            type: 'paragraph',
            text: '**Maintenance** lists every task, newest first, with its property, space, category, priority, status and due date. Overdue tasks are marked **Overdue**.',
          },
          {
            type: 'list',
            items: [
              '**Search tasks** looks in the titles and descriptions.',
              'Filter by **Property**, **Space**, **Priority** and **Status**.',
              '**Due by** shows the tasks due on or before a date, and **Overdue only** the unfinished tasks past their due date.',
            ],
          },
          { type: 'link', to: '/maintenance', label: 'Open Maintenance' },
        ],
      },
      add: {
        title: 'Adding a task',
        blocks: [
          {
            type: 'steps',
            items: [
              'Select **Add task** on the **Maintenance** page, or on a property\'s page, where the property is already chosen.',
              'Choose the **Property**. Choose a **Space** too, or leave it as **Whole property or common area**.',
              'Write a **Title** and, if you like, a **Description**.',
              'Choose the **Category**, **Priority** and **Status**, and optionally a **Due date**.',
              'Select **Save task**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Type the due date as d.m.yyyy, for example 30.9.2026, or choose it from the calendar next to the field.',
          },
        ],
      },
      ai: {
        title: 'Suggest with AI',
        blocks: [
          {
            type: 'paragraph',
            text: 'When the AI features are available, the task form has a **Suggest with AI** button below the description. It suggests a clear title, a description with things to check, a category and a priority. A short title such as "kitchen sink leak" is enough.',
          },
          {
            type: 'steps',
            items: [
              'Write a title, a description or both, in your own words.',
              'Select **Suggest with AI** and wait for the **AI suggestion**.',
              'Read it. **Apply suggestion** fills in the fields, and **Dismiss** keeps what you wrote.',
              'Check and adjust the fields, then select **Save task**. Nothing is saved automatically.',
            ],
          },
          {
            type: 'note',
            text: 'The title and description are sent to Google Gemini, so do not include personal information. The first suggestion can take up to a minute while the server starts.',
          },
        ],
      },
      status: {
        title: 'Following a task',
        blocks: [
          {
            type: 'paragraph',
            text: 'Select a task\'s title to open it. Its page shows the details and the actions for its current status:',
          },
          {
            type: 'list',
            items: [
              '**Start work** moves an open task to **In progress**.',
              '**Mark as completed** completes the task and records when it was completed.',
              '**Reopen task** returns a completed task to **Open**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'To change anything else, select **Edit**.',
          },
        ],
      },
      delete: {
        title: 'Deleting a task',
        blocks: [
          {
            type: 'paragraph',
            text: 'Open the task, select **Delete** and confirm with **Delete task**. Deleting cannot be undone; to keep the history, mark the task as completed instead.',
          },
        ],
      },
    },
  },

  applications: {
    title: 'Applications',
    summary: 'Review rental applications and turn approved applicants into tenants.',
    sections: {
      list: {
        title: 'The application list',
        blocks: [
          {
            type: 'paragraph',
            text: '**Applications** lists the rental applications, newest first, with the applicant, the space, the desired start date, when the application was received and its status. The number next to **Applications** in the sidebar tells how many are new.',
          },
          {
            type: 'list',
            items: [
              'Filter by **Status**. **Open (submitted or in review)** shows the applications that still need a decision.',
              'Filter by **Property**, and search by name, contact person or email.',
            ],
          },
          { type: 'link', to: '/applications', label: 'Open Applications' },
        ],
      },
      review: {
        title: 'Reviewing an application',
        blocks: [
          {
            type: 'paragraph',
            text: 'Select an applicant\'s name to open the application: the applicant\'s contact details, the space and the message. The actions depend on the status:',
          },
          {
            type: 'list',
            items: [
              '**Start review** marks a new application **In review**.',
              '**Approve** accepts the applicant. See the next section.',
              '**Reject** declines the application.',
              '**Mark as withdrawn** records that the applicant cancelled it.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Rejecting and withdrawing ask for confirmation and cannot be undone. If the space has been let, reserved or taken into maintenance meanwhile, the application says so.',
          },
        ],
      },
      approve: {
        title: 'Approving and creating the lease',
        blocks: [
          {
            type: 'steps',
            items: [
              'Select **Approve**. The confirmation tells whether a new tenant is created from the applicant, or the application is linked to an existing tenant with the same email.',
              'Confirm with **Approve**. The lease form opens with the tenant, the space and the desired start date filled in.',
              'Add the end date and the monthly rent if needed, and select **Save lease**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The lease is created only when you save it. If you leave the form, the approved application offers **Create lease** later.',
          },
          {
            type: 'paragraph',
            text: 'After approving, the application lists the **Other applications for this space** that are still open. **Reject all** rejects them together, after confirmation.',
          },
        ],
      },
      'public-form': {
        title: 'The public application form',
        blocks: [
          {
            type: 'paragraph',
            text: 'People looking for a space apply without signing in. The sign-in page has a **Browse available spaces and apply** link, which lists the spaces that can be applied for. Each space has its own page with its details, a map and the form.',
          },
          {
            type: 'paragraph',
            text: 'To open the form yourself, select **Application form** on the **Applications** page, or next to an available space on the **Spaces** list or a property\'s page. It opens in a new tab.',
          },
          {
            type: 'paragraph',
            text: 'A sent application appears in **Applications** as **Submitted**.',
          },
          {
            type: 'note',
            text: 'The form is part of the demo: do not enter real personal information in it.',
          },
        ],
      },
    },
  },

  tenants: {
    title: 'Tenants',
    summary: 'The companies and people who rent your spaces.',
    sections: {
      list: {
        title: 'The tenant list',
        blocks: [
          {
            type: 'paragraph',
            text: '**Tenants** lists companies and people with their contact details and current spaces. Search by name, contact person or email, and filter by **Type**.',
          },
          {
            type: 'paragraph',
            text: 'Select a tenant\'s name to open their page: details, current and upcoming spaces, past leases and approved applications.',
          },
          { type: 'link', to: '/tenants', label: 'Open Tenants' },
        ],
      },
      add: {
        title: 'Adding a tenant',
        blocks: [
          {
            type: 'steps',
            items: [
              'On the **Tenants** page, select **Add tenant**.',
              'Choose the **Tenant type**: company or person.',
              'Fill in the name and **Email**. A company can also have a **Contact person**.',
              'Optionally add a **Phone** number and **Notes**, and select **Save tenant**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Each tenant needs a different email address. Approving an application also creates a tenant.',
          },
        ],
      },
      spaces: {
        title: 'Moving in and out',
        blocks: [
          {
            type: 'list',
            items: [
              '**Assign to space** on the tenant\'s page opens a new lease with the tenant already chosen. See the Leases chapter.',
              '**Remove from space** moves the tenant out today: the lease ends and the space becomes available. A lease that has not started yet is cancelled instead.',
              'To schedule a move-out for a later date, select **Edit lease** and set an end date.',
            ],
          },
        ],
      },
      delete: {
        title: 'Deleting a tenant',
        blocks: [
          {
            type: 'paragraph',
            text: 'Open the tenant, select **Delete** and confirm with **Delete tenant**.',
          },
          {
            type: 'paragraph',
            text: 'A tenant with leases, including past ones, or with approved applications cannot be deleted, so the history is kept.',
          },
        ],
      },
    },
  },

  leases: {
    title: 'Leases',
    summary: 'Connect tenants to spaces for a lease period.',
    sections: {
      list: {
        title: 'The lease list',
        blocks: [
          {
            type: 'paragraph',
            text: '**Leases** lists every lease with its tenant, space, lease period, monthly rent and status. Filter by **Status** and **Property**, or search by tenant or space.',
          },
          { type: 'link', to: '/leases', label: 'Open Leases' },
        ],
      },
      create: {
        title: 'Creating a lease',
        blocks: [
          {
            type: 'steps',
            items: [
              'Select **New lease** on the **Leases** page, or **Assign to space** on a tenant\'s page.',
              'Choose the **Tenant**, the **Property** and the **Space**.',
              'Enter the **Start date**. Leave the **End date** empty for an open-ended lease.',
              'Optionally enter the **Monthly rent (€)**, and select **Save lease**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Before you save, the form tells whether the lease will be active today or starts later. Leases of the same space cannot overlap, and a lease that is active today cannot start in a space that is in maintenance.',
          },
        ],
      },
      status: {
        title: 'Lease status',
        blocks: [
          {
            type: 'paragraph',
            text: 'The status follows the dates, and both the start and the end day belong to the lease:',
          },
          {
            type: 'list',
            items: [
              '**Upcoming**: the lease starts later. Until then the space keeps its status, and the Dashboard marks an available space as reserved.',
              '**Active**: the lease is in force today. The space is occupied.',
              '**Ended**: the end date has passed, and the lease no longer occupies the space.',
            ],
          },
          {
            type: 'paragraph',
            text: 'JalaSpace updates the spaces when leases start and end, so occupancy on the Dashboard stays up to date.',
          },
        ],
      },
      edit: {
        title: 'Editing a lease',
        blocks: [
          {
            type: 'paragraph',
            text: 'Select **Edit** next to a lease to change its dates or rent. A future end date schedules the move-out.',
          },
          {
            type: 'paragraph',
            text: 'The tenant and space of a lease cannot be changed. To move a tenant to another space, end the current lease and create a new one.',
          },
        ],
      },
    },
  },

  settings: {
    title: 'Settings',
    summary: 'Your profile, the language and resetting the demo data.',
    sections: {
      profile: {
        title: 'Profile',
        blocks: [
          {
            type: 'paragraph',
            text: 'Open **Settings** from the sidebar, or select your name in the top bar. Under **Profile**, change your **First name**, **Last name** and **Birthdate**, and select **Save profile**. The top bar shows the new name right away.',
          },
          {
            type: 'paragraph',
            text: 'The birthdate is optional: choose the day, month and year, or leave all three empty. The email is used for signing in and cannot be changed.',
          },
          { type: 'link', to: '/settings', label: 'Open Settings' },
        ],
      },
      language: {
        title: 'Language',
        blocks: [
          {
            type: 'paragraph',
            text: 'The **Language** section offers the same choice as the selector in the top bar. The change applies immediately.',
          },
        ],
      },
      reset: {
        title: 'Resetting the demo data',
        blocks: [
          {
            type: 'paragraph',
            text: '**Reset demo data** under **Demo data** restores the original properties, spaces, tenants, leases, applications, maintenance tasks and profile. You stay signed in, and your language is kept.',
          },
          {
            type: 'steps',
            items: ['Select **Reset demo data**.', 'Read the confirmation and select **Reset demo data** again.'],
          },
          {
            type: 'note',
            text: 'All changes you have made are lost. When the data is shared by everyone who uses the demo, the reset applies to everyone.',
          },
        ],
      },
    },
  },

  walkthroughs: {
    title: 'Walkthroughs',
    summary: 'Common tasks from start to finish, across several pages.',
    sections: {
      'application-to-lease': {
        title: 'From an application to a lease',
        blocks: [
          {
            type: 'paragraph',
            text: 'Someone has applied for an available space, and you want to let it to them.',
          },
          {
            type: 'steps',
            items: [
              'Open **Applications**. New applications have the status **Submitted**.',
              'Select the applicant\'s name, read the application and select **Start review**.',
              'When you have decided, select **Approve** and confirm. The applicant becomes a tenant.',
              'In the lease form that opens, check the start date, add the monthly rent and select **Save lease**.',
              'Back on the application, select **Reject all** to decline the other open applications for the space, if you want to.',
              'On the lease\'s start date, the space becomes occupied, and the Dashboard\'s occupancy includes it.',
            ],
          },
        ],
      },
      'maintenance-task': {
        title: 'Reporting and completing a maintenance task',
        blocks: [
          {
            type: 'paragraph',
            text: 'A tenant reports a leaking sink, and you want to follow the repair until it is done.',
          },
          {
            type: 'steps',
            items: [
              'Open **Maintenance** and select **Add task**.',
              'Choose the property and the space, and write a title such as "kitchen sink leak".',
              'If available, select **Suggest with AI**, review the suggestion and select **Apply suggestion**.',
              'Check the priority, set a due date and select **Save task**.',
              'When the work begins, open the task and select **Start work**.',
              'When the repair is done, select **Mark as completed**. The task leaves the open maintenance count and appears in **Recent activity** on the Dashboard.',
            ],
          },
        ],
      },
      'new-property': {
        title: 'Adding a property with its spaces',
        blocks: [
          {
            type: 'paragraph',
            text: 'You have acquired a new building and want to start letting its spaces.',
          },
          {
            type: 'steps',
            items: [
              'Open **Properties**, select **Add property** and fill in the name and address.',
              'Search for the address under **Location** and choose the match, then select **Save property**.',
              'Open the new property and select **Add space** for each apartment or unit.',
              'The new spaces are **Available**. They appear on the public application form, and people can apply for them.',
              'When a tenant is found, create the lease: approve their application, or select **New lease** on the **Leases** page.',
            ],
          },
        ],
      },
    },
  },
}
