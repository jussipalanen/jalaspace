import type { PropertyLocation, PropertyType } from '../../types/property'
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
  location: PropertyLocation
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

// The properties are fictional: the street addresses do not exist ("Esimerkki"
// is Finnish for "example"), but the cities and postal codes are real, so the
// postal code rule and the maps work. Each location is a general spot near the
// centre of its city, shown from further out, never a specific building. The
// backend seed (backend/src/domain/demoData.ts) uses the same values.
export const propertySeeds: PropertySeed[] = [
  {
    key: 'joensuu-center',
    name: 'Joensuu Center',
    address: 'Esimerkkikatu 12',
    postalCode: '80100',
    city: 'Joensuu',
    location: { latitude: 62.6013, longitude: 29.7636, zoom: 15 },
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
      'cafe-esimerkki',
      'outdoor-store-esimerkki',
      'florist-esimerkki',
      'health-clinic-esimerkki',
      ...repeat('software-esimerkki', 4),
      ...repeat('accounting-esimerkki', 3),
      ...repeat('design-studio-esimerkki', 2),
      ...repeat('law-office-esimerkki', 3),
      ...repeat('games-esimerkki', 3),
    ],
  },
  {
    key: 'kuopio-harbour',
    name: 'Kuopio Harbour Business Park',
    address: 'Esimerkinranta 5',
    postalCode: '70100',
    city: 'Kuopio',
    location: { latitude: 62.8925, longitude: 27.6782, zoom: 15 },
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
      ...repeat('architects-esimerkki', 4),
      ...repeat('games-esimerkki', 3),
      ...repeat('software-esimerkki', 2),
      ...repeat('energy-consulting-esimerkki', 3),
      ...repeat('marketing-esimerkki', 3),
    ],
  },
  {
    key: 'tampere-hervanta',
    name: 'Tampere Hervanta Logistics',
    address: 'Esimerkintie 20',
    postalCode: '33720',
    city: 'Tampere',
    location: { latitude: 61.4502, longitude: 23.8517, zoom: 14 },
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
      ...repeat('freight-esimerkki', 3),
      ...repeat('machinery-esimerkki', 3),
      'freight-esimerkki',
      ...repeat('outdoor-store-esimerkki', 2),
      'accounting-esimerkki',
    ],
  },
  {
    key: 'helsinki-kallio',
    name: 'Helsinki Kallio Residences',
    address: 'Esimerkkikuja 15',
    postalCode: '00500',
    city: 'Helsinki',
    location: { latitude: 60.1841, longitude: 24.951, zoom: 15 },
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
  { tenant: 'yoga-studio-esimerkki', property: 'joensuu-center', spaceIndex: 11, startInDays: 45, endInDays: null },
  { tenant: 'design-studio-esimerkki', property: 'joensuu-center', spaceIndex: 4, startInDays: -900, endInDays: -60 },
  { tenant: 'bookshop-esimerkki', property: 'kuopio-harbour', spaceIndex: 2, startInDays: -1100, endInDays: -120 },
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
