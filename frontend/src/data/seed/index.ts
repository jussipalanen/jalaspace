import type { DemoData } from '../../types/demoData'
import type { Lease } from '../../types/lease'
import type { MaintenanceTask } from '../../types/maintenance'
import type { Property } from '../../types/property'
import type { Space, SpaceStatus } from '../../types/space'
import type { Tenant } from '../../types/tenant'
import { addDays, toIsoDate } from '../../utils/date'
import { maintenanceSeeds } from './maintenance'
import { inactiveLeaseSeeds, propertySeeds, rentPerSquareMetre } from './properties'
import { tenantSeeds } from './tenants'

/**
 * Bump when the seed data or its shape changes. Browsers with an older
 * version are re-seeded on their next visit.
 */
export const SEED_VERSION = 2

// Seed entities use stable, readable ids; entities created in the app use UUIDs.
const propertyId = (key: string) => `property-${key}`
const tenantId = (key: string) => `tenant-${key}`
const spaceId = (propertyKey: string, index: number) => `space-${propertyKey}-${index + 1}`

function monthlyRentCents(space: Space): number {
  return Math.round(space.areaM2 * rentPerSquareMetre[space.type] * 100)
}

/**
 * Builds the demo dataset. Dates are relative to `now`, so the demo always
 * contains current, upcoming and past activity.
 */
export function createSeedData(now: Date = new Date()): DemoData {
  const daysAgo = (days: number) => addDays(now, -days).toISOString()
  const dateIn = (days: number) => toIsoDate(addDays(now, days))

  const properties: Property[] = []
  const spaces: Space[] = []
  const leases: Lease[] = []
  const spacesByProperty = new Map<string, Space[]>()

  const today = dateIn(0)

  const addLease = (space: Space, tenantKey: string, startDate: string, endDate: string | null) => {
    // Leases are recorded when they start, or ahead of time for upcoming leases.
    const timestamp = startDate <= today ? `${startDate}T09:00:00.000Z` : daysAgo(10)
    leases.push({
      id: `lease-${leases.length + 1}`,
      tenantId: tenantId(tenantKey),
      spaceId: space.id,
      startDate,
      endDate,
      monthlyRentCents: monthlyRentCents(space),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  for (const seed of propertySeeds) {
    const createdAt = daysAgo(seed.createdDaysAgo)
    properties.push({
      id: propertyId(seed.key),
      name: seed.name,
      address: seed.address,
      postalCode: seed.postalCode,
      city: seed.city,
      type: seed.type,
      description: seed.description,
      createdAt,
      updatedAt: createdAt,
    })

    const propertySpaces: Space[] = []
    for (const group of seed.spaces) {
      let ordinal = 0
      for (const floor of group.floors) {
        for (let index = 0; index < group.perFloor; index++) {
          ordinal++
          const position = propertySpaces.length
          const status: SpaceStatus = seed.available.includes(position)
            ? 'available'
            : seed.maintenance.includes(position)
              ? 'maintenance'
              : 'occupied'

          propertySpaces.push({
            id: spaceId(seed.key, position),
            propertyId: propertyId(seed.key),
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

    const occupied = propertySpaces.filter((space) => space.status === 'occupied')
    if (occupied.length !== seed.occupants.length) {
      throw new Error(
        `Seed "${seed.key}" has ${occupied.length} occupied spaces but ${seed.occupants.length} occupants`,
      )
    }

    // Occupied spaces get an active lease that started in the past.
    // Every third lease is fixed-term, the rest are open-ended.
    occupied.forEach((space, index) => {
      const ordinal = leases.length
      const startDate = dateIn(-(90 + ((ordinal * 47) % 1000)))
      const endDate = ordinal % 3 === 0 ? dateIn(180 + ((ordinal * 29) % 540)) : null
      addLease(space, seed.occupants[index], startDate, endDate)
    })

    spaces.push(...propertySpaces)
    spacesByProperty.set(seed.key, propertySpaces)
  }

  const findSpace = (propertyKey: string, index: number): Space => {
    const space = spacesByProperty.get(propertyKey)?.[index]
    if (!space) throw new Error(`Seed space ${propertyKey}[${index}] does not exist`)
    return space
  }

  for (const seed of inactiveLeaseSeeds) {
    const space = findSpace(seed.property, seed.spaceIndex)
    addLease(
      space,
      seed.tenant,
      dateIn(seed.startInDays),
      seed.endInDays === null ? null : dateIn(seed.endInDays),
    )
  }

  const tenants: Tenant[] = tenantSeeds.map((seed, index) => {
    const createdAt = daysAgo(700 - index * 20)
    return {
      id: tenantId(seed.key),
      type: seed.type,
      name: seed.name,
      contactPerson: seed.contactPerson,
      email: seed.email,
      phone: null,
      notes: seed.notes,
      createdAt,
      updatedAt: createdAt,
    }
  })

  const maintenance: MaintenanceTask[] = maintenanceSeeds.map((seed, index) => {
    const createdAt = daysAgo(seed.createdDaysAgo)
    const completedAt =
      seed.status === 'completed' && seed.completedDaysAgo !== undefined
        ? daysAgo(seed.completedDaysAgo)
        : null
    return {
      id: `maintenance-${index + 1}`,
      propertyId: propertyId(seed.property),
      spaceId: seed.spaceIndex === null ? null : findSpace(seed.property, seed.spaceIndex).id,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      priority: seed.priority,
      status: seed.status,
      dueDate: seed.dueInDays === null ? null : dateIn(seed.dueInDays),
      completedAt,
      createdAt,
      updatedAt: completedAt ?? createdAt,
    }
  })

  return { properties, spaces, tenants, leases, maintenance }
}
