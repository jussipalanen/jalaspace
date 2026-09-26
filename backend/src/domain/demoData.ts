import type { Store } from '../store/store.ts'
import { maintenanceSeeds } from './demoMaintenance.ts'
import { tenantSeeds } from './demoTenants.ts'
import type { Lease } from './leases.ts'
import type { MaintenanceTask } from './maintenance.ts'
import type { Property, PropertyInput } from './properties.ts'
import { SPACE_FEATURES, type Space, type SpaceFeature, type SpaceStatus, type SpaceType } from './spaces.ts'
import type { Tenant } from './tenants.ts'

const DAY_MS = 24 * 60 * 60 * 1000

/** A group of similar spaces, e.g. six offices on each of floors 2–4. */
interface SpaceGroupSeed {
  type: SpaceType
  floors: number[]
  perFloor: number
  /** `index` is the 0-based position within the floor; `ordinal` counts within the group. */
  name: (floor: number, index: number, ordinal: number) => string
  area: (floor: number, index: number) => number
  /** Missing: rooms are not recorded. */
  rooms?: (floor: number, index: number) => number
  features?: (floor: number, index: number) => SpaceFeature[]
}

interface PropertySeed extends PropertyInput {
  key: string
  createdDaysAgo: number
  spaces: SpaceGroupSeed[]
  /** Space indexes (0-based, in generation order) that are free. */
  available: number[]
  /** Space indexes that are out of use because of maintenance. */
  maintenance: number[]
  /** Tenant keys for the remaining, occupied spaces, in order. */
  occupants: string[]
}

const pad = (value: number) => String(value).padStart(2, '0')

const repeat = (key: string, count: number): string[] => Array<string>(count).fill(key)

/** The features that are on, in the stored order. */
const has = (flags: Partial<Record<SpaceFeature, boolean>>): SpaceFeature[] =>
  SPACE_FEATURES.filter((feature) => flags[feature])

// The same properties and spaces, ids and creation dates as the frontend seed
// (frontend/src/data/seed/properties.ts and index.ts), so the data matches
// once the frontend reads it from the API. The remaining spaces are occupied,
// each with an active lease.
// Locations were looked up once with OpenStreetMap Nominatim (issue #130).
// OpenStreetMap has no house number 20 on Hermiankatu, so Tampere uses a
// point on the street, shown from further out.
const propertySeeds: PropertySeed[] = [
  {
    key: 'joensuu-center',
    name: 'Joensuu Center',
    address: 'Siltakatu 12',
    postalCode: '80100',
    city: 'Joensuu',
    location: { latitude: 62.601579, longitude: 29.762079, zoom: 17 },
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
        features: () => has({ accessible: true }),
      },
      {
        type: 'office',
        floors: [2, 3, 4],
        perFloor: 6,
        name: (floor, index) => `A ${floor}${pad(index + 1)}`,
        area: (floor, index) => 45 + ((index * 17 + floor * 11) % 40),
        rooms: (floor, index) => 2 + ((index + floor) % 3),
        features: (_floor, index) => has({ accessible: true, kitchen: index % 3 === 0 }),
      },
    ],
    available: [4, 11],
    maintenance: [15],
    occupants: [
      'jarvi-coffee',
      'northwind-outdoor',
      'lumo-florist',
      'harbour-health',
      ...repeat('nordic-pixel', 4),
      ...repeat('karelia-accounting', 3),
      ...repeat('saimaa-design', 2),
      ...repeat('koivu-manty-law', 3),
      ...repeat('revontuli-games', 3),
    ],
  },
  {
    key: 'kuopio-harbour',
    name: 'Kuopio Harbour Business Park',
    address: 'Satamakatu 5',
    postalCode: '70100',
    city: 'Kuopio',
    location: { latitude: 62.888821, longitude: 27.694464, zoom: 17 },
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
        features: (floor, index) =>
          has({
            sauna: floor === 3 && index === 5,
            furnished: index < 2,
            parking: true,
            accessible: true,
            kitchen: index % 2 === 1,
          }),
      },
    ],
    available: [2, 9, 16],
    maintenance: [],
    occupants: [
      ...repeat('kivea-architects', 4),
      ...repeat('revontuli-games', 3),
      ...repeat('nordic-pixel', 2),
      ...repeat('savo-energy', 3),
      ...repeat('kallavesi-marketing', 3),
    ],
  },
  {
    key: 'tampere-hervanta',
    name: 'Tampere Hervanta Logistics',
    address: 'Hermiankatu 20',
    postalCode: '33720',
    city: 'Tampere',
    location: { latitude: 61.447397, longitude: 23.859037, zoom: 15 },
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
        features: () => has({ parking: true, accessible: true, loading_dock: true }),
      },
      {
        type: 'storage',
        floors: [1],
        perFloor: 6,
        name: (_floor, _index, ordinal) => `Storage ${ordinal}`,
        area: (_floor, index) => 20 + ((index * 7) % 25),
        features: (_floor, index) => has({ accessible: true, loading_dock: index < 2 }),
      },
    ],
    available: [7],
    maintenance: [3],
    occupants: [
      ...repeat('arctic-freight', 3),
      ...repeat('tervas-machinery', 3),
      'arctic-freight',
      ...repeat('northwind-outdoor', 2),
      'karelia-accounting',
    ],
  },
  {
    key: 'helsinki-kallio',
    name: 'Helsinki Kallio Residences',
    address: 'Fleminginkatu 15',
    postalCode: '00500',
    city: 'Helsinki',
    location: { latitude: 60.186508, longitude: 24.953475, zoom: 17 },
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
        rooms: (_floor, index) => Math.min(index + 1, 3),
        features: (floor, index) =>
          has({
            // The larger apartments have their own sauna.
            sauna: index === 3 || (index === 2 && floor >= 3),
            balcony: floor >= 2,
            furnished: index === 0,
            parking: index >= 2 && floor <= 2,
            accessible: floor === 1,
            kitchen: true,
          }),
      },
    ],
    available: [10],
    maintenance: [6],
    occupants: [
      'aino-esimerkki',
      'mikko-esimerkki',
      'laura-esimerkki',
      'juha-esimerkki',
      'emilia-esimerkki',
      'ville-esimerkki',
      'sanna-esimerkki',
      'antti-esimerkki',
      'noora-esimerkki',
      'eero-esimerkki',
      'helmi-esimerkki',
      'onni-esimerkki',
      'iida-esimerkki',
      'matias-esimerkki',
    ],
  },
]

/** Leases that are not currently active, on spaces without an active lease. */
interface InactiveLeaseSeed {
  tenant: string
  property: string
  spaceIndex: number
  /** Offsets in days from today. */
  startInDays: number
  endInDays: number | null
}

const inactiveLeaseSeeds: InactiveLeaseSeed[] = [
  { tenant: 'aurora-yoga', property: 'joensuu-center', spaceIndex: 11, startInDays: 45, endInDays: null },
  { tenant: 'saimaa-design', property: 'joensuu-center', spaceIndex: 4, startInDays: -900, endInDays: -60 },
  { tenant: 'old-town-books', property: 'kuopio-harbour', spaceIndex: 2, startInDays: -1100, endInDays: -120 },
  { tenant: 'kalle-esimerkki', property: 'helsinki-kallio', spaceIndex: 10, startInDays: -700, endInDays: -30 },
]

/** Monthly rent in euros per square metre, by space type. */
const rentPerSquareMetre: Record<SpaceType, number> = {
  office: 19,
  retail: 26,
  industrial: 9,
  storage: 11,
  apartment: 18,
}

export interface DemoData {
  properties: Property[]
  spaces: Space[]
  maintenance: MaintenanceTask[]
  tenants: Tenant[]
  leases: Lease[]
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
          rooms: group.rooms?.(floor, index) ?? null,
          features: group.features?.(floor, index) ?? [],
          status,
          createdAt,
          updatedAt: createdAt,
        })
      }
    }
  }
  return spaces
}

/**
 * Builds the demo dataset. Dates are relative to `now`, like in the frontend;
 * date-only values such as due dates use the UTC calendar day.
 */
export function createDemoData(now: Date = new Date()): DemoData {
  const daysAgo = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString()
  const dateIn = (days: number) => daysAgo(-days).slice(0, 10)

  const today = dateIn(0)

  const data: DemoData = { properties: [], spaces: [], maintenance: [], tenants: [], leases: [] }
  const spacesByProperty = new Map<string, Space[]>()

  const addLease = (space: Space, tenantKey: string, startDate: string, endDate: string | null) => {
    // Leases are recorded when they start, or ahead of time for upcoming leases.
    const timestamp = startDate <= today ? `${startDate}T09:00:00.000Z` : daysAgo(10)
    data.leases.push({
      id: `lease-${data.leases.length + 1}`,
      tenantId: `tenant-${tenantKey}`,
      spaceId: space.id,
      startDate,
      endDate,
      monthlyRentCents: Math.round(space.areaM2 * rentPerSquareMetre[space.type] * 100),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  for (const seed of propertySeeds) {
    const {
      key,
      createdDaysAgo,
      spaces: _spaces,
      available: _available,
      maintenance: _maintenance,
      occupants,
      ...input
    } = seed
    const id = `property-${key}`
    const createdAt = daysAgo(createdDaysAgo)
    data.properties.push({ id, ...input, createdAt, updatedAt: createdAt })
    const spaces = createSpaces(seed, id, createdAt)
    data.spaces.push(...spaces)
    spacesByProperty.set(key, spaces)

    const occupied = spaces.filter((space) => space.status === 'occupied')
    if (occupied.length !== occupants.length) {
      throw new Error(`Seed "${key}" has ${occupied.length} occupied spaces but ${occupants.length} occupants`)
    }
    // Occupied spaces get an active lease that started in the past.
    // Every third lease is fixed-term, the rest are open-ended.
    occupied.forEach((space, index) => {
      const ordinal = data.leases.length
      const startDate = dateIn(-(90 + ((ordinal * 47) % 1000)))
      const endDate = ordinal % 3 === 0 ? dateIn(180 + ((ordinal * 29) % 540)) : null
      addLease(space, occupants[index]!, startDate, endDate)
    })
  }

  for (const seed of inactiveLeaseSeeds) {
    const space = spacesByProperty.get(seed.property)?.[seed.spaceIndex]
    if (!space) throw new Error(`Seed space ${seed.property}[${seed.spaceIndex}] does not exist`)
    addLease(space, seed.tenant, dateIn(seed.startInDays), seed.endInDays === null ? null : dateIn(seed.endInDays))
  }

  data.maintenance = maintenanceSeeds.map((seed, index) => {
    const { property, spaceIndex, createdDaysAgo, dueInDays, completedDaysAgo, ...fields } = seed
    const createdAt = daysAgo(createdDaysAgo)
    const completedAt =
      seed.status === 'completed' && completedDaysAgo !== undefined ? daysAgo(completedDaysAgo) : null
    return {
      id: `maintenance-${index + 1}`,
      propertyId: `property-${property}`,
      spaceId: spaceIndex === null ? null : `space-${property}-${spaceIndex + 1}`,
      ...fields,
      dueDate: dueInDays === null ? null : dateIn(dueInDays),
      completedAt,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    }
  })

  data.tenants = tenantSeeds.map(({ key, ...fields }, index) => {
    const createdAt = daysAgo(700 - index * 20)
    return { id: `tenant-${key}`, ...fields, phone: null, createdAt, updatedAt: createdAt }
  })
  return data
}

/** Removes all data and restores the demo dataset. */
export async function resetDemoData(store: Store, now: Date = new Date()): Promise<void> {
  await Promise.all([
    store.properties.clear(),
    store.spaces.clear(),
    store.maintenance.clear(),
    store.tenants.clear(),
    store.leases.clear(),
  ])
  const data = createDemoData(now)
  for (const property of data.properties) await store.properties.insert(property)
  for (const space of data.spaces) await store.spaces.insert(space)
  for (const task of data.maintenance) await store.maintenance.insert(task)
  for (const lease of data.leases) await store.leases.insert(lease)
  for (const tenant of data.tenants) await store.tenants.insert(tenant)
}
