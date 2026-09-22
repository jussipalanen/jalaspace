import type { Entity } from './common'

export type SpaceType = 'office' | 'retail' | 'industrial' | 'storage' | 'apartment'

export type SpaceStatus = 'available' | 'occupied' | 'maintenance'

export interface Space extends Entity {
  propertyId: string
  name: string
  type: SpaceType
  floor: number
  areaM2: number
  status: SpaceStatus
}
