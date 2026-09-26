import { isRecord, readText, type Entity, type FieldErrorCode, type ParseResult } from './common.ts'

// The rules match the frontend (frontend/src/services/properties.ts), so the
// UI can translate every field error the API returns. Change them together.

export const PROPERTY_TYPES = ['office', 'retail', 'industrial', 'residential', 'mixed_use'] as const

export type PropertyType = (typeof PROPERTY_TYPES)[number]

export const PROPERTY_NAME_MAX_LENGTH = 100
export const PROPERTY_DESCRIPTION_MAX_LENGTH = 1000

export const POSTAL_CODE_PATTERN = /^\d{5}$/

export const LATITUDE_MIN = -90
export const LATITUDE_MAX = 90
export const LONGITUDE_MIN = -180
export const LONGITUDE_MAX = 180
/** Coordinates are stored with this many decimals, about 0.1 m. */
export const COORDINATE_DECIMALS = 6

/** A point on the map in WGS 84 degrees, as used by OpenStreetMap. */
export interface GeoLocation {
  latitude: number
  longitude: number
}

/** The fields a client may set; the server sets `id`, `createdAt` and `updatedAt`. */
export interface PropertyInput {
  name: string
  type: PropertyType
  address: string
  postalCode: string
  city: string
  description: string
  /** Where the building is, or `null` when not set. */
  location: GeoLocation | null
}

export interface Property extends Entity, PropertyInput {}

function isPropertyType(value: unknown): value is PropertyType {
  return (PROPERTY_TYPES as readonly unknown[]).includes(value)
}

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
}

function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS
  return Math.round(value * factor) / factor
}

/**
 * Reads the optional location: missing or `null` is no location, so clients
 * that do not send it keep working. Coordinates are rounded to 6 decimals.
 * Returns `undefined` when the value is invalid.
 */
function readLocation(value: unknown): GeoLocation | null | undefined {
  if (value === undefined || value === null) return null
  if (!isRecord(value)) return undefined
  const { latitude, longitude } = value
  if (!isCoordinate(latitude, LATITUDE_MIN, LATITUDE_MAX)) return undefined
  if (!isCoordinate(longitude, LONGITUDE_MIN, LONGITUDE_MAX)) return undefined
  return { latitude: roundCoordinate(latitude), longitude: roundCoordinate(longitude) }
}

/** Checks a request body and returns the trimmed input, or an error code per field. */
export function parsePropertyInput(body: unknown): ParseResult<PropertyInput> {
  const source = isRecord(body) ? body : {}
  const errors: Partial<Record<keyof PropertyInput, FieldErrorCode>> = {}

  const name = readText(source, 'name')
  if (name === undefined) errors.name = 'invalid'
  else if (!name) errors.name = 'required'
  else if (name.length > PROPERTY_NAME_MAX_LENGTH) errors.name = 'tooLong'

  const address = readText(source, 'address')
  if (address === undefined) errors.address = 'invalid'
  else if (!address) errors.address = 'required'

  const postalCode = readText(source, 'postalCode')
  if (postalCode === undefined) errors.postalCode = 'invalid'
  else if (!postalCode) errors.postalCode = 'required'
  else if (!POSTAL_CODE_PATTERN.test(postalCode)) errors.postalCode = 'invalid'

  const city = readText(source, 'city')
  if (city === undefined) errors.city = 'invalid'
  else if (!city) errors.city = 'required'

  const description = readText(source, 'description')
  if (description === undefined) errors.description = 'invalid'
  else if (description.length > PROPERTY_DESCRIPTION_MAX_LENGTH) errors.description = 'tooLong'

  const type = source.type
  if (type === undefined || type === null || type === '') errors.type = 'required'
  else if (!isPropertyType(type)) errors.type = 'invalid'

  const location = readLocation(source.location)
  if (location === undefined) errors.location = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      name: name!,
      type: type as PropertyType,
      address: address!,
      postalCode: postalCode!,
      city: city!,
      description: description!,
      location: location as GeoLocation | null,
    },
  }
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
  spaces: readonly { propertyId: string }[],
  maintenance: readonly { propertyId: string }[],
): PropertyDeletionCheck {
  const spaceCount = spaces.filter((space) => space.propertyId === propertyId).length
  const maintenanceCount = maintenance.filter((task) => task.propertyId === propertyId).length
  return { allowed: spaceCount === 0 && maintenanceCount === 0, spaceCount, maintenanceCount }
}
