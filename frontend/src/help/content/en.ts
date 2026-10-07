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
            text: 'To sign out, select the button at the right end of the top bar.',
          },
          {
            type: 'note',
            text: 'This is a demo. The data is fictional and anyone can sign in, so never enter real personal information.',
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
              'On a phone the sidebar is hidden. Open it with the menu button at the left end of the top bar, and close it with the close button or the Escape key.',
              'The number next to **Applications** tells how many new applications are waiting.',
              'The **?** button in the top bar opens the handbook chapter for the page you are on.',
              'Your name in the top bar opens your profile in **Settings**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Lists have a search field and filters above them. The filters stay when you reload the page. If you copy the link and send it to someone, they see the same filtered list.',
          },
        ],
      },
      language: {
        title: 'Language',
        blocks: [
          {
            type: 'paragraph',
            text: 'JalaSpace is available in English and Finnish. Choose the language from the **Language** menu in the top bar, on the sign-in page or in **Settings**. The page changes at once, and you stay on the same page.',
          },
          {
            type: 'paragraph',
            text: 'Your choice is remembered in this browser. Names, addresses and other text entered by users are not translated, so the demo data stays in English.',
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
            text: 'The note at the bottom of the sidebar tells who sees your changes: only you in this browser, or everyone who uses the demo.',
          },
          {
            type: 'paragraph',
            text: 'To start over, [reset the demo data](/help/settings#reset) in **Settings**.',
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
              '**Spaces**: all spaces, split into occupied, available, reserved (a lease starts later) and in maintenance.',
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
            text: 'Below the key figures are short lists. Select an item to open it, or **View all** to open the full list.',
          },
          {
            type: 'list',
            items: [
              '**Recent maintenance**: the latest tasks with their priority and due date.',
              '**Available spaces**: spaces that can be let now, and how many applications each has. A space where a lease starts later is marked as reserved.',
              '**Latest applications**: the five newest applications and their status.',
              '**Recent activity**: completed maintenance, leases that started or ended, and applications that were received or approved.',
            ],
          },
        ],
      },
      ask: {
        title: 'Ask JalaSpace',
        blocks: [
          {
            type: 'paragraph',
            text: 'With the **Ask JalaSpace** card you can ask a question in English or Finnish. It shows where to go in the app, or which records match. For example:',
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
            type: 'steps',
            items: [
              'Type your question and select **Ask**, or choose one of the examples under **Try asking**.',
              'Under **Understood as**, check how your question was understood. Remove a condition to widen the search.',
              'Select a result to open it, or **Open in** to see all results on their list page.',
            ],
          },
          {
            type: 'note',
            text: 'Your question is sent to Google Gemini, so do not include personal information. The AI only interprets the question: the results always come from your own data in JalaSpace.',
          },
          {
            type: 'paragraph',
            text: 'If you don\'t see the card, the AI features are turned off in this demo.',
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
            text: '**Properties** lists your buildings and sites, with how many spaces each has, how many are occupied and how much maintenance is open.',
          },
          {
            type: 'paragraph',
            text: 'Use **Search properties** to find a property by name, address, postal code or city. Select a property\'s name to open it.',
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
              '**Spaces**: every space in the property, with its status and current tenant. **Add space** creates a new space here.',
              '**Open maintenance**: the tasks that are not completed. **Add task** creates a task for this property.',
              '**Location**: the property on a map, if a location has been set.',
            ],
          },
          {
            type: 'paragraph',
            text: 'If people can apply for an available space, it has an **Application form** link. The link opens the public application form in a new tab.',
          },
        ],
      },
      'add-edit': {
        title: 'Adding and editing a property',
        blocks: [
          {
            type: 'steps',
            items: [
              'On the **Properties** page, select **Add property**. To change a property, open it and select **Edit**.',
              'Fill in the **Name**, **Type**, **Street address**, **Postal code** and **City**. Fields marked with * are required.',
              'If you like, add a **Description** and [set the location](/help/properties#location).',
              'Select **Save property**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The postal code has five digits, for example 80100. If something is missing or wrong, the form shows which fields to correct.',
          },
        ],
      },
      location: {
        title: 'Setting the location',
        blocks: [
          {
            type: 'paragraph',
            text: 'The location is optional. You set it in the property form, and the property\'s page shows it on a map.',
          },
          {
            type: 'steps',
            items: [
              'Check the address in the **Search address** field. It is filled in from the address fields.',
              'Select **Search** or press Enter, then choose the right place under **Matches**. The pin moves there.',
              'To fine-tune, drag the pin or click the map. You can also type the **Latitude** and **Longitude**.',
              'Zoom the map to the level you want: it is saved with the location.',
            ],
          },
          {
            type: 'paragraph',
            text: '**Clear location** removes the location. On the property\'s page, **Open in OpenStreetMap** shows the place on the OpenStreetMap website.',
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
            text: 'Open the property, select **Delete** and confirm with **Delete property**. Deleting cannot be undone.',
          },
          {
            type: 'paragraph',
            text: 'You cannot delete a property that still has spaces or maintenance tasks. JalaSpace tells you what they are, so you can remove or move them first.',
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
            text: '**Spaces** lists the rentable spaces of all your properties, with their status and current tenant.',
          },
          {
            type: 'list',
            items: [
              '**Search spaces** finds a space by its name or its tenant\'s name.',
              'Filter by **Property**, **Status** and **Rooms** (1–4, or 5 or more).',
              'Under **Features**, choose what a space must have, for example a sauna and a balcony. Only spaces with all the chosen features are shown.',
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
              'If you like, add the number of **Rooms** and the **Features**.',
              'Select **Save space**.',
            ],
          },
          {
            type: 'list',
            items: [
              'Each space in a property needs its own name, for example A 101.',
              'The floor is a whole number. A basement is −1.',
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
              'A space is occupied while it has an active lease. JalaSpace changes this for you when a lease starts and ends.',
              'While a space is occupied, you cannot change its status.',
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
            text: 'Open the space, select **Delete space** at the bottom of the form, and confirm. Deleting cannot be undone.',
          },
          {
            type: 'paragraph',
            text: 'You cannot delete a space that has leases, maintenance tasks or applications. JalaSpace lists them, so you can handle them first.',
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
            text: '**Maintenance** lists every task, newest first. Tasks that are past their due date are marked **Overdue**.',
          },
          {
            type: 'list',
            items: [
              '**Search tasks** looks in the titles and descriptions.',
              'Filter by **Property**, **Space**, **Priority** and **Status**.',
              '**Due by** shows the tasks due on or before a date.',
              '**Overdue only** shows the unfinished tasks that are past their due date.',
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
              'Choose the **Category**, **Priority** and **Status**. If you like, add a **Due date**.',
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
            text: '**Suggest with AI**, below the description, helps you write the task. It suggests a clear title, a description with things to check, a category and a priority. A short title such as "kitchen sink leak" is enough.',
          },
          {
            type: 'steps',
            items: [
              'Write a title, a description or both, in your own words.',
              'Select **Suggest with AI** and wait for the **AI suggestion**.',
              'Read it. **Apply suggestion** fills in the fields, and **Dismiss** keeps what you wrote.',
              'Check the fields, change them if needed, and select **Save task**. Nothing is saved until you do.',
            ],
          },
          {
            type: 'note',
            text: 'The title and description are sent to Google Gemini, so do not include personal information. The first suggestion can take up to a minute.',
          },
          {
            type: 'paragraph',
            text: 'If you don\'t see the button, the AI features are turned off in this demo.',
          },
        ],
      },
      status: {
        title: 'Following a task',
        blocks: [
          {
            type: 'paragraph',
            text: 'Select a task\'s title to open it. The buttons on its page depend on the task\'s status:',
          },
          {
            type: 'list',
            items: [
              '**Start work** moves an open task to **In progress**.',
              '**Mark as completed** completes the task and records when it was done.',
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
            text: 'Open the task, select **Delete** and confirm with **Delete task**. Deleting cannot be undone. To keep a record of the work, mark the task as completed instead.',
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
            text: '**Applications** lists the rental applications, newest first. The number next to **Applications** in the sidebar tells how many are new.',
          },
          {
            type: 'list',
            items: [
              'Filter by **Status**. **Open (submitted or in review)** shows the applications that still need a decision.',
              'Filter by **Property**, or search by name, contact person or email.',
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
            text: 'Every application has a status:',
          },
          {
            type: 'list',
            items: [
              '**Submitted**: new, nobody has looked at it yet.',
              '**In review**: you are handling it.',
              '**Approved**: the applicant became a tenant.',
              '**Rejected**: you declined it.',
              '**Withdrawn**: the applicant cancelled it.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Select an applicant\'s name to open the application. You see their contact details, the space and their message. Then choose what to do:',
          },
          {
            type: 'list',
            items: [
              '**Start review** marks a new application as in review.',
              '**Approve** accepts the applicant. See [Approving and creating the lease](/help/applications#approve).',
              '**Reject** declines the application.',
              '**Mark as withdrawn** records that the applicant cancelled it.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Rejecting and withdrawing ask you to confirm, and cannot be undone. If the space is no longer available, the application tells you.',
          },
        ],
      },
      approve: {
        title: 'Approving and creating the lease',
        blocks: [
          {
            type: 'steps',
            items: [
              'Select **Approve**. JalaSpace tells you whether it creates a new tenant, or links the application to a tenant who has the same email.',
              'Confirm with **Approve**. The lease form opens, with the tenant, the space and the start date already filled in.',
              'Add the end date and the monthly rent if needed, and select **Save lease**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The lease is created only when you save it. If you leave the form, you can create the lease later with **Create lease** on the application.',
          },
          {
            type: 'paragraph',
            text: 'After approving, the application lists the **Other applications for this space**. **Reject all** declines them all at once, after you confirm.',
          },
        ],
      },
      'public-form': {
        title: 'The public application form',
        blocks: [
          {
            type: 'paragraph',
            text: 'People looking for a space apply without signing in. On the sign-in page they select **Browse available spaces and apply**, choose a space and fill in its form.',
          },
          {
            type: 'paragraph',
            text: 'To open the form yourself, select **Application form** on the **Applications** page, or next to an available space. It opens in a new tab.',
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
            text: '**Tenants** lists the companies and people who rent from you, with their contact details and current spaces. Search by name, contact person or email, and filter by **Type**.',
          },
          {
            type: 'paragraph',
            text: 'Select a tenant\'s name to open their page. It shows their details, current and upcoming spaces, past leases and approved applications.',
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
              'Fill in the name and **Email**. For a company, you can also add a **Contact person**.',
              'If you like, add a **Phone** number and **Notes**. Select **Save tenant**.',
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
              '**Assign to space** on the tenant\'s page opens a new lease with the tenant already chosen. See [Creating a lease](/help/leases#create).',
              '**Remove from space** moves the tenant out today: the lease ends and the space becomes available. If the lease has not started yet, it is cancelled.',
              'To move the tenant out on a later date, select **Edit lease** and set an end date.',
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
            text: 'You cannot delete a tenant who has leases, including past ones, or approved applications. This keeps the history.',
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
            text: '**Leases** lists every lease, with its tenant, space, period, rent and status. Filter by **Status** and **Property**, or search by tenant or space.',
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
              'Enter the **Start date**. If the lease has no end, leave the **End date** empty.',
              'If you like, enter the **Monthly rent (€)**. Select **Save lease**.',
            ],
          },
          {
            type: 'paragraph',
            text: 'Before you save, the form tells whether the lease is active today or starts later.',
          },
          {
            type: 'list',
            items: [
              'Two leases of the same space cannot overlap.',
              'A space in maintenance cannot get a lease that is active today.',
            ],
          },
        ],
      },
      status: {
        title: 'Lease status',
        blocks: [
          {
            type: 'paragraph',
            text: 'The status follows the dates. A lease is in force on its first and last day.',
          },
          {
            type: 'list',
            items: [
              '**Upcoming**: the lease starts later. Until then the space keeps its status, and the Dashboard shows it as reserved.',
              '**Active**: the lease is in force today, and the space is occupied.',
              '**Ended**: the end date has passed, and the lease no longer holds the space.',
            ],
          },
          {
            type: 'paragraph',
            text: 'JalaSpace updates the spaces when leases start and end, so the occupancy on the Dashboard is always up to date.',
          },
        ],
      },
      edit: {
        title: 'Editing a lease',
        blocks: [
          {
            type: 'paragraph',
            text: 'Select **Edit** next to a lease to change its dates or rent. An end date in the future schedules the move-out.',
          },
          {
            type: 'paragraph',
            text: 'You cannot change the tenant or the space of a lease. To move a tenant to another space, end the current lease and create a new one.',
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
            text: 'Open **Settings** from the sidebar, or select your name in the top bar.',
          },
          {
            type: 'steps',
            items: [
              'Under **Profile**, change your **First name**, **Last name** or **Birthdate**.',
              'Select **Save profile**. The top bar shows the new name at once.',
            ],
          },
          {
            type: 'paragraph',
            text: 'The birthdate is optional: choose the day, month and year, or leave all three empty. You sign in with your email, so it cannot be changed.',
          },
          { type: 'link', to: '/settings', label: 'Open Settings' },
        ],
      },
      language: {
        title: 'Language',
        blocks: [
          {
            type: 'paragraph',
            text: 'The **Language** section has the same choice as the menu in the top bar. The change applies at once.',
          },
        ],
      },
      reset: {
        title: 'Resetting the demo data',
        blocks: [
          {
            type: 'paragraph',
            text: '**Reset demo data**, under **Demo data**, brings back the original properties, spaces, tenants, leases, applications, maintenance tasks and profile. You stay signed in, and your language stays the same.',
          },
          {
            type: 'steps',
            items: ['Select **Reset demo data**.', 'Read the message and select **Reset demo data** again.'],
          },
          {
            type: 'note',
            text: 'All your changes are lost. If everyone who uses the demo sees the same data, the reset applies to everyone.',
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
              'Back on the application, you can decline the other open applications for the space with **Reject all**.',
              'On the start date, the space becomes occupied, and the Dashboard\'s occupancy includes it.',
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
              'If you like, select **Suggest with AI**, check the suggestion and select **Apply suggestion**. See [Suggest with AI](/help/maintenance#ai).',
              'Check the priority, set a due date and select **Save task**.',
              'When the work begins, open the task and select **Start work**.',
              'When the repair is done, select **Mark as completed**. The task is no longer counted as open, and it appears under **Recent activity** on the Dashboard.',
            ],
          },
        ],
      },
      'new-property': {
        title: 'Adding a property with its spaces',
        blocks: [
          {
            type: 'paragraph',
            text: 'You have bought a new building and want to start letting its spaces.',
          },
          {
            type: 'steps',
            items: [
              'Open **Properties**, select **Add property** and fill in the name and address.',
              'Under **Location**, search for the address and choose the match. Select **Save property**.',
              'Open the new property and select **Add space** for each apartment or unit.',
              'New spaces are **Available**. They appear on the public application form, so people can apply for them.',
              'When you find a tenant, create the lease: approve their application, or select **New lease** on the **Leases** page.',
            ],
          },
        ],
      },
    },
  },
}
