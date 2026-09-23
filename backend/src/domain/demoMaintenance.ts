import type { MaintenanceCategory, MaintenancePriority, MaintenanceStatus } from './maintenance.ts'

// The same tasks as the frontend seed (frontend/src/data/seed/maintenance.ts).
// Change them together, so the data matches once the frontend reads it from the API.

export interface MaintenanceSeed {
  property: string
  /** Space index within the property, or `null` for common areas. */
  spaceIndex: number | null
  title: string
  description: string
  category: MaintenanceCategory
  priority: MaintenancePriority
  status: MaintenanceStatus
  createdDaysAgo: number
  /** Due date as an offset in days from today. */
  dueInDays: number | null
  /** For completed tasks: how many days ago the task was completed. */
  completedDaysAgo?: number
}

export const maintenanceSeeds: MaintenanceSeed[] = [
  {
    property: 'joensuu-center',
    spaceIndex: 15,
    title: 'Water damage in office ceiling',
    description: 'Water stain spreading in the ceiling of A 306 after heavy rain. Roof membrane suspected.',
    category: 'structural',
    priority: 'high',
    status: 'in_progress',
    createdDaysAgo: 6,
    dueInDays: 4,
  },
  {
    property: 'joensuu-center',
    spaceIndex: 0,
    title: 'Grease trap service',
    description: 'Scheduled grease trap emptying for the café in Retail 1.',
    category: 'plumbing',
    priority: 'medium',
    status: 'open',
    createdDaysAgo: 3,
    dueInDays: 10,
  },
  {
    property: 'joensuu-center',
    spaceIndex: null,
    title: 'Main entrance door closer broken',
    description: 'The main entrance door does not close by itself. Building is not secured at night.',
    category: 'general',
    priority: 'high',
    status: 'open',
    createdDaysAgo: 1,
    dueInDays: 2,
  },
  {
    property: 'joensuu-center',
    spaceIndex: null,
    title: 'Replace stairwell lighting with LEDs',
    description: 'Replace fluorescent tubes in stairwells A and B with LED fittings.',
    category: 'electrical',
    priority: 'low',
    status: 'completed',
    createdDaysAgo: 40,
    dueInDays: -25,
    completedDaysAgo: 30,
  },
  {
    property: 'kuopio-harbour',
    spaceIndex: null,
    title: 'Annual ventilation inspection',
    description: 'Yearly inspection and filter change for the ventilation units on the roof.',
    category: 'hvac',
    priority: 'medium',
    status: 'open',
    createdDaysAgo: 10,
    dueInDays: 20,
  },
  {
    property: 'kuopio-harbour',
    spaceIndex: 5,
    title: 'Air conditioning too cold',
    description: 'Tenant reports the air conditioning in B 106 cannot be adjusted and is too cold.',
    category: 'hvac',
    priority: 'medium',
    status: 'in_progress',
    createdDaysAgo: 4,
    dueInDays: 3,
  },
  {
    property: 'kuopio-harbour',
    spaceIndex: null,
    title: 'Repaint parking area lines',
    description: 'Parking bay lines and disabled-parking markings have faded.',
    category: 'general',
    priority: 'low',
    status: 'completed',
    createdDaysAgo: 60,
    dueInDays: -40,
    completedDaysAgo: 45,
  },
  {
    property: 'tampere-hervanta',
    spaceIndex: 3,
    title: 'Loading dock door motor failure',
    description: 'The motor of the overhead door in Hall 4 failed. The hall cannot be used for deliveries.',
    category: 'electrical',
    priority: 'high',
    status: 'in_progress',
    createdDaysAgo: 2,
    dueInDays: 1,
  },
  {
    property: 'tampere-hervanta',
    spaceIndex: null,
    title: 'Roof snow removal',
    description: 'Remove snow from the flat roof of halls 1–3 before the load limit is reached.',
    category: 'structural',
    priority: 'high',
    status: 'completed',
    createdDaysAgo: 20,
    dueInDays: -18,
    completedDaysAgo: 19,
  },
  {
    property: 'tampere-hervanta',
    spaceIndex: 9,
    title: 'Replace storage unit lock',
    description: 'Lock cylinder of Storage 4 is worn and hard to turn.',
    category: 'general',
    priority: 'low',
    status: 'open',
    createdDaysAgo: 8,
    dueInDays: 14,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: 6,
    title: 'Bathroom renovation after leak',
    description: 'Waterproofing failed in the bathroom of A 7. Apartment is empty during the renovation.',
    category: 'plumbing',
    priority: 'high',
    status: 'in_progress',
    createdDaysAgo: 15,
    dueInDays: 30,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: 2,
    title: 'Dripping kitchen faucet',
    description: 'Resident reports a constantly dripping kitchen faucet in A 3.',
    category: 'plumbing',
    priority: 'low',
    status: 'open',
    createdDaysAgo: 5,
    dueInDays: 7,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: null,
    title: 'Sauna heater inspection',
    description: 'Shared sauna heater trips the circuit breaker. Needs an electrician.',
    category: 'electrical',
    priority: 'medium',
    status: 'open',
    createdDaysAgo: 12,
    dueInDays: 5,
  },
  {
    property: 'helsinki-kallio',
    spaceIndex: null,
    title: 'Update stairwell cleaning schedule',
    description: 'Agree on a new weekly cleaning day with the cleaning contractor.',
    category: 'cleaning',
    priority: 'low',
    status: 'completed',
    createdDaysAgo: 30,
    dueInDays: -20,
    completedDaysAgo: 28,
  },
]
