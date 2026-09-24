import type { Entity } from './common'

export type SpaceType = 'office' | 'retail' | 'industrial' | 'storage' | 'apartment'

export type SpaceStatus = 'available' | 'occupied' | 'maintenance'

export type SpaceFeature =
  | 'sauna'
  | 'balcony'
  | 'furnished'
  | 'parking'
  | 'accessible'
  | 'loading_dock'
  | 'kitchen'

export interface Space extends Entity {
  propertyId: string
  name: string
  type: SpaceType
  floor: number
  areaM2: number
  /** Number of rooms, or `null` when not recorded. */
  rooms: number | null
  /** Stored in the order of `SPACE_FEATURES`, without duplicates. */
  features: SpaceFeature[]
  status: SpaceStatus
}
