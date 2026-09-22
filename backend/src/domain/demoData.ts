import type { Store } from '../store/store.ts'
import type { Property, PropertyInput } from './properties.ts'

const DAY_MS = 24 * 60 * 60 * 1000

interface PropertySeed extends PropertyInput {
  key: string
  createdDaysAgo: number
}

// The same properties, ids and creation dates as the frontend seed
// (frontend/src/data/seed/properties.ts), so the data matches once the
// frontend reads it from the API. Spaces, maintenance tasks, tenants and
// leases are added here with their endpoints.
const propertySeeds: PropertySeed[] = [
  {
    key: 'joensuu-center',
    name: 'Joensuu Center',
    address: 'Siltakatu 12',
    postalCode: '80100',
    city: 'Joensuu',
    type: 'mixed_use',
    description: 'City-centre building with street-level shops and three floors of offices.',
    createdDaysAgo: 720,
  },
  {
    key: 'kuopio-harbour',
    name: 'Kuopio Harbour Business Park',
    address: 'Satamakatu 5',
    postalCode: '70100',
    city: 'Kuopio',
    type: 'office',
    description: 'Modern office building by the harbour with flexible open-plan floors.',
    createdDaysAgo: 540,
  },
  {
    key: 'tampere-hervanta',
    name: 'Tampere Hervanta Logistics',
    address: 'Hermiankatu 20',
    postalCode: '33720',
    city: 'Tampere',
    type: 'industrial',
    description: 'Warehouse and light-industrial halls with loading docks and storage units.',
    createdDaysAgo: 480,
  },
  {
    key: 'helsinki-kallio',
    name: 'Helsinki Kallio Residences',
    address: 'Fleminginkatu 15',
    postalCode: '00530',
    city: 'Helsinki',
    type: 'residential',
    description: 'Renovated residential building with 16 apartments.',
    createdDaysAgo: 400,
  },
]

export interface DemoData {
  properties: Property[]
}

/** Builds the demo dataset. Dates are relative to `now`, like in the frontend. */
export function createDemoData(now: Date = new Date()): DemoData {
  return {
    properties: propertySeeds.map(({ key, createdDaysAgo, ...input }) => {
      const createdAt = new Date(now.getTime() - createdDaysAgo * DAY_MS).toISOString()
      return { id: `property-${key}`, ...input, createdAt, updatedAt: createdAt }
    }),
  }
}

/** Removes all data and restores the demo dataset. */
export async function resetDemoData(store: Store, now: Date = new Date()): Promise<void> {
  await Promise.all([store.properties.clear(), store.spaces.clear(), store.maintenance.clear()])
  for (const property of createDemoData(now).properties) await store.properties.insert(property)
}
