import type { Entity } from './common'

export type PropertyType = 'office' | 'retail' | 'industrial' | 'residential' | 'mixed_use'

/** A point on the map in WGS 84 degrees, as used by OpenStreetMap. */
export interface GeoLocation {
  latitude: number
  longitude: number
}

/** A property's location and the zoom level its map is shown at. */
export interface PropertyLocation extends GeoLocation {
  zoom: number
}

export interface Property extends Entity {
  name: string
  address: string
  postalCode: string
  city: string
  type: PropertyType
  description: string
  /** Where the building is, or `null` when not set. */
  location: PropertyLocation | null
}
