import type { IsoDateTime } from '../types/common'
import { generateId } from '../utils/id'
import type { MaintenanceTask } from '../types/maintenance'
import type { Property, PropertyType } from '../types/property'
import type { Space } from '../types/space'
import { calculateOccupancy, isOpenMaintenance, type OccupancyMetrics } from './metrics'

export const PROPERTY_TYPES: readonly PropertyType[] = [
  'office',
  'retail',
  'industrial',
  'residential',
  'mixed_use',
]

export function isPropertyType(value: string): value is PropertyType {
  return (PROPERTY_TYPES as readonly string[]).includes(value)
}

export const PROPERTY_NAME_MAX_LENGTH = 100
export const PROPERTY_DESCRIPTION_MAX_LENGTH = 1000

export interface PropertyFormValues {
  name: string
  type: PropertyType
  address: string
  postalCode: string
  city: string
  description: string
}

/** Error codes per field; the UI translates them (`properties.form.validation.<field>.<code>`). */
export interface PropertyFormErrors {
  name?: 'required' | 'tooLong'
  address?: 'required'
  postalCode?: 'required' | 'invalid'
  city?: 'required'
  description?: 'tooLong'
}

const POSTAL_CODE_PATTERN = /^\d{5}$/

export function emptyPropertyForm(): PropertyFormValues {
  return { name: '', type: 'office', address: '', postalCode: '', city: '', description: '' }
}

export function toPropertyForm(property: Property): PropertyFormValues {
  const { name, type, address, postalCode, city, description } = property
  return { name, type, address, postalCode, city, description }
}

export function validatePropertyForm(values: PropertyFormValues): PropertyFormErrors {
  const errors: PropertyFormErrors = {}
  const name = values.name.trim()

  if (!name) errors.name = 'required'
  else if (name.length > PROPERTY_NAME_MAX_LENGTH) errors.name = 'tooLong'

  if (!values.address.trim()) errors.address = 'required'

  const postalCode = values.postalCode.trim()
  if (!postalCode) errors.postalCode = 'required'
  else if (!POSTAL_CODE_PATTERN.test(postalCode)) errors.postalCode = 'invalid'

  if (!values.city.trim()) errors.city = 'required'

  if (values.description.trim().length > PROPERTY_DESCRIPTION_MAX_LENGTH) {
    errors.description = 'tooLong'
  }

  return errors
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean)
}

function normalize(values: PropertyFormValues): PropertyFormValues {
  return {
    name: values.name.trim(),
    type: values.type,
    address: values.address.trim(),
    postalCode: values.postalCode.trim(),
    city: values.city.trim(),
    description: values.description.trim(),
  }
}

/** Builds a new property entity from validated form values. */
export function buildNewProperty(
  values: PropertyFormValues,
  now: IsoDateTime,
  id: string = generateId(),
): Property {
  return { id, ...normalize(values), createdAt: now, updatedAt: now }
}

/** Applies validated form values to an existing property. */
export function applyPropertyChanges(
  property: Property,
  values: PropertyFormValues,
  now: IsoDateTime,
): Property {
  return { ...property, ...normalize(values), updatedAt: now }
}

export interface PropertySummary extends OccupancyMetrics {
  property: Property
  openMaintenanceCount: number
}

/** Adds space and maintenance metrics to each property, sorted by name. */
export function summarizeProperties(
  properties: Property[],
  spaces: Space[],
  maintenance: MaintenanceTask[],
  locale: string,
): PropertySummary[] {
  const collator = new Intl.Collator(locale, { numeric: true })
  return properties
    .map((property) => ({
      property,
      ...calculateOccupancy(spaces.filter((space) => space.propertyId === property.id)),
      openMaintenanceCount: maintenance.filter(
        (task) => task.propertyId === property.id && isOpenMaintenance(task),
      ).length,
    }))
    .toSorted((a, b) => collator.compare(a.property.name, b.property.name))
}

/** Case-insensitive search in name, address, postal code and city. */
export function matchesPropertySearch(property: Property, query: string, locale: string): boolean {
  const terms = query.trim().toLocaleLowerCase(locale).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true

  const haystack = [property.name, property.address, property.postalCode, property.city]
    .join(' ')
    .toLocaleLowerCase(locale)
  return terms.every((term) => haystack.includes(term))
}

export interface PropertyDeletionCheck {
  allowed: boolean
  spaceCount: number
  maintenanceCount: number
}

/**
 * A property can only be deleted when nothing refers to it: deleting it would
 * otherwise leave spaces (and their leases) or maintenance tasks orphaned.
 */
export function checkPropertyDeletion(
  propertyId: string,
  spaces: Space[],
  maintenance: MaintenanceTask[],
): PropertyDeletionCheck {
  const spaceCount = spaces.filter((space) => space.propertyId === propertyId).length
  const maintenanceCount = maintenance.filter((task) => task.propertyId === propertyId).length
  return { allowed: spaceCount === 0 && maintenanceCount === 0, spaceCount, maintenanceCount }
}
