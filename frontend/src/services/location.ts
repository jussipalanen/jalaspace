import type { GeoLocation } from '../types/property'

// The rules match the API (backend/src/domain/properties.ts). Change them together.

export const LATITUDE_MIN = -90
export const LATITUDE_MAX = 90
export const LONGITUDE_MIN = -180
export const LONGITUDE_MAX = 180
/** Coordinates are stored with this many decimals, about 0.1 m. */
export const COORDINATE_DECIMALS = 6
/** Map zoom levels of OpenStreetMap's tiles that make sense for a building. */
export const MAP_ZOOM_MIN = 1
export const MAP_ZOOM_MAX = 19
/** Zoom level for a new location, close enough to tell buildings apart. */
export const DEFAULT_MAP_ZOOM = 16

export function isMapZoom(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= MAP_ZOOM_MIN && value <= MAP_ZOOM_MAX
}

export type Coordinate = 'latitude' | 'longitude'

const RANGES: Record<Coordinate, [min: number, max: number]> = {
  latitude: [LATITUDE_MIN, LATITUDE_MAX],
  longitude: [LONGITUDE_MIN, LONGITUDE_MAX],
}

export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMALS
  return Math.round(value * factor) / factor
}

/** Rounds both coordinates to the stored precision. */
export function roundLocation(location: GeoLocation): GeoLocation {
  return { latitude: roundCoordinate(location.latitude), longitude: roundCoordinate(location.longitude) }
}

/**
 * Parses a coordinate the user typed, in degrees. A decimal comma is accepted,
 * as Finnish users write one. Returns `null` for text or an out-of-range value.
 */
export function parseCoordinate(text: string, coordinate: Coordinate): number | null {
  const trimmed = text.trim().replace(',', '.')
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) return null
  const value = Number(trimmed)
  const [min, max] = RANGES[coordinate]
  return value >= min && value <= max ? roundCoordinate(value) : null
}

/** Coordinate as form text: a dot as the decimal separator, at most 6 decimals. */
export function formatCoordinate(value: number): string {
  return String(roundCoordinate(value))
}

/** True when two locations are the same at the stored precision. */
export function isSameLocation(a: GeoLocation | null, b: GeoLocation | null): boolean {
  if (a === null || b === null) return a === b
  return roundCoordinate(a.latitude) === roundCoordinate(b.latitude) &&
    roundCoordinate(a.longitude) === roundCoordinate(b.longitude)
}
