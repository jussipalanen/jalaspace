import { isRecord, readText, type Entity, type FieldErrorCode, type ParseResult } from './common.ts'

// The rules match the frontend (frontend/src/services/spaces.ts), so the UI
// can translate every field error the API returns. Change them together.

export const SPACE_TYPES = ['office', 'retail', 'industrial', 'storage', 'apartment'] as const
export const SPACE_STATUSES = ['available', 'occupied', 'maintenance'] as const
/** What a space offers; stored in this order, without duplicates. */
export const SPACE_FEATURES = [
  'sauna',
  'balcony',
  'furnished',
  'parking',
  'accessible',
  'loading_dock',
  'kitchen',
] as const

export type SpaceType = (typeof SPACE_TYPES)[number]
export type SpaceStatus = (typeof SPACE_STATUSES)[number]
export type SpaceFeature = (typeof SPACE_FEATURES)[number]

export const SPACE_NAME_MAX_LENGTH = 50
export const SPACE_FLOOR_MIN = -10
export const SPACE_FLOOR_MAX = 200
export const SPACE_AREA_MAX = 100_000
export const SPACE_ROOMS_MIN = 1
export const SPACE_ROOMS_MAX = 50

/** The fields a client may set; the server sets `id`, `createdAt` and `updatedAt`. */
export interface SpaceInput {
  propertyId: string
  name: string
  type: SpaceType
  floor: number
  areaM2: number
  /** Number of rooms, or `null` when not recorded. */
  rooms: number | null
  features: SpaceFeature[]
  status: SpaceStatus
}

export interface Space extends Entity, SpaceInput {}

export type SpaceFieldErrors = Partial<Record<keyof SpaceInput, FieldErrorCode>>

function isSpaceType(value: unknown): value is SpaceType {
  return (SPACE_TYPES as readonly unknown[]).includes(value)
}

function isSpaceStatus(value: unknown): value is SpaceStatus {
  return (SPACE_STATUSES as readonly unknown[]).includes(value)
}

function isSpaceFeature(value: unknown): value is SpaceFeature {
  return (SPACE_FEATURES as readonly unknown[]).includes(value)
}

const isMissing = (value: unknown) => value === undefined || value === null || value === ''

/** A positive area with at most two decimals, e.g. 62.5. */
function isValidArea(value: number): boolean {
  const hundredths = value * 100
  return (
    value > 0 &&
    value <= SPACE_AREA_MAX &&
    // Tolerates binary rounding, e.g. 12.34 * 100 = 1233.9999999999998.
    Math.abs(hundredths - Math.round(hundredths)) < 1e-6
  )
}

/**
 * Checks a request body and returns the trimmed input, or an error code per
 * field. Rules that need other data, such as unique names, are in
 * `checkSpaceReferences`.
 */
export function parseSpaceInput(body: unknown): ParseResult<SpaceInput> {
  const source = isRecord(body) ? body : {}
  const errors: SpaceFieldErrors = {}

  const propertyId = readText(source, 'propertyId')
  if (propertyId === undefined) errors.propertyId = 'invalid'
  else if (!propertyId) errors.propertyId = 'required'

  const name = readText(source, 'name')
  if (name === undefined) errors.name = 'invalid'
  else if (!name) errors.name = 'required'
  else if (name.length > SPACE_NAME_MAX_LENGTH) errors.name = 'tooLong'

  const { type, floor, areaM2, rooms, features, status } = source
  if (isMissing(type)) errors.type = 'required'
  else if (!isSpaceType(type)) errors.type = 'invalid'

  if (isMissing(floor)) errors.floor = 'required'
  else if (
    typeof floor !== 'number' ||
    !Number.isInteger(floor) ||
    floor < SPACE_FLOOR_MIN ||
    floor > SPACE_FLOOR_MAX
  ) {
    errors.floor = 'invalid'
  }

  if (isMissing(areaM2)) errors.areaM2 = 'required'
  else if (typeof areaM2 !== 'number' || !isValidArea(areaM2)) errors.areaM2 = 'invalid'

  // Rooms and features are optional, so clients that do not send them keep working.
  if (
    !isMissing(rooms) &&
    (typeof rooms !== 'number' ||
      !Number.isInteger(rooms) ||
      rooms < SPACE_ROOMS_MIN ||
      rooms > SPACE_ROOMS_MAX)
  ) {
    errors.rooms = 'invalid'
  }

  if (features !== undefined && features !== null && (!Array.isArray(features) || !features.every(isSpaceFeature))) {
    errors.features = 'invalid'
  }

  if (isMissing(status)) errors.status = 'required'
  else if (!isSpaceStatus(status)) errors.status = 'invalid'

  if (Object.keys(errors).length > 0) return { ok: false, errors }
  return {
    ok: true,
    // Every field was checked above; the assertions only narrow the types.
    values: {
      propertyId: propertyId!,
      name: name!,
      type: type as SpaceType,
      floor: floor as number,
      areaM2: areaM2 as number,
      rooms: isMissing(rooms) ? null : (rooms as number),
      features: normalizeFeatures(Array.isArray(features) ? (features as SpaceFeature[]) : []),
      status: status as SpaceStatus,
    },
  }
}

/** Removes duplicates and puts the features in the order of `SPACE_FEATURES`. */
export function normalizeFeatures(features: readonly SpaceFeature[]): SpaceFeature[] {
  return SPACE_FEATURES.filter((feature) => features.includes(feature))
}

export interface SpaceReferenceData {
  propertyExists: boolean
  spaces: readonly Pick<Space, 'id' | 'propertyId' | 'name'>[]
  maintenance: readonly { spaceId: string | null }[]
  /** The space being updated; missing when creating one. */
  existing?: Pick<Space, 'id' | 'propertyId'>
}

/** Checks the input against the current data; an empty result means it can be saved. */
export function checkSpaceReferences(input: SpaceInput, data: SpaceReferenceData): SpaceFieldErrors {
  const errors: SpaceFieldErrors = {}
  const { existing } = data

  if (!data.propertyExists) errors.propertyId = 'notFound'
  else if (
    existing &&
    existing.propertyId !== input.propertyId &&
    // Tasks refer to both a property and a space; moving only the space would
    // leave those references inconsistent.
    data.maintenance.some((task) => task.spaceId === existing.id)
  ) {
    errors.propertyId = 'maintenanceLinked'
  }

  // Names are unique within a property, ignoring case.
  const name = input.name.toLowerCase()
  if (
    data.spaces.some(
      (space) =>
        space.id !== existing?.id &&
        space.propertyId === input.propertyId &&
        space.name.trim().toLowerCase() === name,
    )
  ) {
    errors.name = 'duplicate'
  }

  return errors
}

/**
 * Applies the business rule "an active lease means occupied": with an active
 * lease the space is always occupied; without one it cannot be occupied.
 */
export function resolveSpaceStatus(requested: SpaceStatus, hasActiveLease: boolean): SpaceStatus {
  if (hasActiveLease) return 'occupied'
  return requested === 'occupied' ? 'available' : requested
}

export interface SpaceDeletionCheck {
  allowed: boolean
  leaseCount: number
  maintenanceCount: number
}

/** A space can only be deleted when no lease or maintenance task refers to it. */
export function checkSpaceDeletion(
  spaceId: string,
  leases: readonly { spaceId: string }[],
  maintenance: readonly { spaceId: string | null }[],
): SpaceDeletionCheck {
  const leaseCount = leases.filter((lease) => lease.spaceId === spaceId).length
  const maintenanceCount = maintenance.filter((task) => task.spaceId === spaceId).length
  return { allowed: leaseCount === 0 && maintenanceCount === 0, leaseCount, maintenanceCount }
}
