import type { PropertyType } from '../../types/property'
import { SPACE_FEATURES } from '../../services/spaces'
import type { SpaceFeature, SpaceType } from '../../types/space'

export interface SpaceGroupSeed {
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

export interface PropertySeed {
  key: string
  name: string
  address: string
  postalCode: string
  city: string
  type: PropertyType
  description: string
  createdDaysAgo: number
  spaces: SpaceGroupSeed[]
  /** Space indexes (0-based, in generation order) that are free. */
  available: number[]
  /** Space indexes that are out of use because of maintenance. */
  maintenance: number[]
  /** Tenant keys for the remaining, occupied spaces, in order. */
  occupants: string[]
}

const repeat = (key: string, count: number): string[] => Array<string>(count).fill(key)

const pad = (value: number) => String(value).padStart(2, '0')

/** The features that are on, in the stored order. */
const has = (flags: Partial<Record<SpaceFeature, boolean>>): SpaceFeature[] =>
  SPACE_FEATURES.filter((feature) => flags[feature])

// Addresses are illustrative; the properties and their details are fictional.
export const propertySeeds: PropertySeed[] = [
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
        area: (floor, index) => 32 + (((floor - 1) * 4 + index) * 13) % 50,
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
export interface InactiveLeaseSeed {
  tenant: string
  property: string
  spaceIndex: number
  /** Offsets in days from today. */
  startInDays: number
  endInDays: number | null
}

export const inactiveLeaseSeeds: InactiveLeaseSeed[] = [
  { tenant: 'aurora-yoga', property: 'joensuu-center', spaceIndex: 11, startInDays: 45, endInDays: null },
  { tenant: 'saimaa-design', property: 'joensuu-center', spaceIndex: 4, startInDays: -900, endInDays: -60 },
  { tenant: 'old-town-books', property: 'kuopio-harbour', spaceIndex: 2, startInDays: -1100, endInDays: -120 },
  { tenant: 'kalle-esimerkki', property: 'helsinki-kallio', spaceIndex: 10, startInDays: -700, endInDays: -30 },
]

/** Monthly rent in euros per square metre, by space type. */
export const rentPerSquareMetre: Record<SpaceType, number> = {
  office: 19,
  retail: 26,
  industrial: 9,
  storage: 11,
  apartment: 18,
}
