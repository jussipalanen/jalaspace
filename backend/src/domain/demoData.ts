import type { Store } from '../store/store.ts'
import type { Property, PropertyInput } from './properties.ts'
import type { Space, SpaceStatus, SpaceType } from './spaces.ts'

const DAY_MS = 24 * 60 * 60 * 1000

/** A group of similar spaces, e.g. six offices on each of floors 2–4. */
interface SpaceGroupSeed {
  type: SpaceType
  floors: number[]
  perFloor: number
  /** `index` is the 0-based position within the floor; `ordinal` counts within the group. */
  name: (floor: number, index: number, ordinal: number) => string
  area: (floor: number, index: number) => number
}

interface PropertySeed extends PropertyInput {
  key: string
  createdDaysAgo: number
  spaces: SpaceGroupSeed[]
  /** Space indexes (0-based, in generation order) that are free. */
  available: number[]
  /** Space indexes that are out of use because of maintenance. */
  maintenance: number[]
}

const pad = (value: number) => String(value).padStart(2, '0')

// The same properties and spaces, ids and creation dates as the frontend seed
// (frontend/src/data/seed/properties.ts and index.ts), so the data matches
// once the frontend reads it from the API. The remaining spaces are occupied;
// their leases, the tenants and the maintenance tasks are added here with
// their endpoints.
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
    spaces: [
      {
        type: 'retail',
        floors: [1],
        perFloor: 4,
        name: (_floor, _index, ordinal) => `Retail ${ordinal}`,
        area: (_floor, index) => 140 + ((index * 53) % 110),
      },
      {
        type: 'office',
        floors: [2, 3, 4],
        perFloor: 6,
        name: (floor, index) => `A ${floor}${pad(index + 1)}`,
        area: (floor, index) => 45 + ((index * 17 + floor * 11) % 40),
      },
    ],
    available: [4, 11],
    maintenance: [15],
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
    spaces: [
      {
        type: 'office',
        floors: [1, 2, 3],
        perFloor: 6,
        name: (floor, index) => `B ${floor}${pad(index + 1)}`,
        area: (floor, index) => 60 + ((index * 23 + floor * 7) % 55),
      },
    ],
    available: [2, 9, 16],
    maintenance: [],
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
    spaces: [
      {
        type: 'industrial',
        floors: [1],
        perFloor: 6,
        name: (_floor, _index, ordinal) => `Hall ${ordinal}`,
        area: (_floor, index) => 400 + ((index * 97) % 350),
      },
      {
        type: 'storage',
        floors: [1],
        perFloor: 6,
        name: (_floor, _index, ordinal) => `Storage ${ordinal}`,
        area: (_floor, index) => 20 + ((index * 7) % 25),
      },
    ],
    available: [7],
    maintenance: [3],
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
    spaces: [
      {
        type: 'apartment',
        floors: [1, 2, 3, 4],
        perFloor: 4,
        name: (_floor, _index, ordinal) => `A ${ordinal}`,
        area: (floor, index) => 32 + ((((floor - 1) * 4 + index) * 13) % 50),
      },
    ],
    available: [10],
    maintenance: [6],
  },
]

export interface DemoData {
  properties: Property[]
  spaces: Space[]
}

function createSpaces(seed: PropertySeed, propertyId: string, createdAt: string): Space[] {
  const spaces: Space[] = []
  for (const group of seed.spaces) {
    let ordinal = 0
    for (const floor of group.floors) {
      for (let index = 0; index < group.perFloor; index++) {
        ordinal++
        const position = spaces.length
        const status: SpaceStatus = seed.available.includes(position)
          ? 'available'
          : seed.maintenance.includes(position)
            ? 'maintenance'
            : 'occupied'
        spaces.push({
          id: `space-${seed.key}-${position + 1}`,
          propertyId,
          name: group.name(floor, index, ordinal),
          type: group.type,
          floor,
          areaM2: group.area(floor, index),
          status,
          createdAt,
          updatedAt: createdAt,
        })
      }
    }
  }
  return spaces
}

/** Builds the demo dataset. Dates are relative to `now`, like in the frontend. */
export function createDemoData(now: Date = new Date()): DemoData {
  const data: DemoData = { properties: [], spaces: [] }
  for (const seed of propertySeeds) {
    const { key, createdDaysAgo, spaces: _spaces, available: _available, maintenance: _maintenance, ...input } =
      seed
    const id = `property-${key}`
    const createdAt = new Date(now.getTime() - createdDaysAgo * DAY_MS).toISOString()
    data.properties.push({ id, ...input, createdAt, updatedAt: createdAt })
    data.spaces.push(...createSpaces(seed, id, createdAt))
  }
  return data
}

/** Removes all data and restores the demo dataset. */
export async function resetDemoData(store: Store, now: Date = new Date()): Promise<void> {
  await Promise.all([
    store.properties.clear(),
    store.spaces.clear(),
    store.maintenance.clear(),
    store.leases.clear(),
  ])
  const data = createDemoData(now)
  for (const property of data.properties) await store.properties.insert(property)
  for (const space of data.spaces) await store.spaces.insert(space)
}
